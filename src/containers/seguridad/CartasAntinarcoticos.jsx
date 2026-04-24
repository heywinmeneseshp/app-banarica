import React, { useEffect, useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { Badge, Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { FaCog, FaExternalLinkAlt, FaPaperPlane, FaSearch } from 'react-icons/fa';

import CartaAntinarcoticosPDF from '@components/documentos/CartaAntinarcoticosPDF';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
import { paginarEmbarques } from '@services/api/embarques';
import { paginarListado } from '@services/api/listado';
import { listarSemanas } from '@services/api/semanas';
import { enviarCorreo } from '@services/api/correo';
import { listarProductosSeguridad } from '@services/api/seguridad';
import { filterActiveContainerRows } from '@utils/contenedorEstado';
import {
  buildCartaAntinarcoticosData,
  buildCartaAntinarcoticosMailHtml,
  buildCartaAntinarcoticosMailSubject,
  buildCartaListadoRows,
  buildCartaZipBaseName,
  normalizeCartaConfig,
} from '@utils/cartaAntinarcoticos';
import { generateCartaAntinarcoticosExcelBuffer } from '@utils/generateCartaAntinarcoticosExcel';
import { useAuth } from '@hooks/useAuth';
import { getAppBaseUrl } from '@utils/appUrl';

const ENVIO_MODULE = 'cartaAntinarcoticosEnvio';
const CARTA_MODULE = 'cartaAntinarcoticos';

const blobToArrayBuffer = async (blob) => new Uint8Array(await blob.arrayBuffer());

const fileToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const resolveLogoForPdf = async (url) => {
  const source = String(url || '').trim();
  if (!source) {
    return '';
  }

  if (source.startsWith('data:')) {
    return source;
  }

  const absoluteSource = /^https?:\/\//i.test(source)
    ? source
    : `${getAppBaseUrl()}${source.startsWith('/') ? source : `/${source}`}`;

  try {
    const response = await fetch(absoluteSource);
    if (!response.ok) {
      throw new Error(`No se pudo cargar el logo: ${response.status}`);
    }

    const blob = await response.blob();
    return await fileToDataUrl(blob);
  } catch (error) {
    console.warn('No fue posible incrustar el logo para el PDF, se usara la URL original.', error);
    return absoluteSource;
  }
};

const normalizeEnvioConfig = (value) => {
  if (!value) {
    return { destinatarios: '', selloProducto: '' };
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return {
      destinatarios: parsed?.destinatarios || '',
      selloProducto: String(parsed?.selloProducto || ''),
    };
  } catch (error) {
    return {
      destinatarios: typeof value === 'string' ? value : '',
      selloProducto: '',
    };
  }
};

const parseRecipients = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildGroupKey = (embarque) =>
  String(
    embarque?.id
      || embarque?.anuncio
      || embarque?.sae
      || embarque?.booking
      || embarque?.bl
      || Math.random()
  );

const buildShipmentGroups = (embarques = [], listados = []) => {
  const rows = Array.isArray(listados) ? listados : [];

  return (Array.isArray(embarques) ? embarques : []).map((embarque) => {
    const matchedRows = rows.filter((row) => {
      const rowShipment = row?.Embarque;

      return (
        row?.id_embarque === embarque?.id
        || rowShipment?.id === embarque?.id
        || (embarque?.anuncio && rowShipment?.anuncio === embarque?.anuncio)
        || (embarque?.booking && (rowShipment?.booking === embarque?.booking || rowShipment?.bl === embarque?.booking))
        || (embarque?.bl && (rowShipment?.bl === embarque?.bl || rowShipment?.booking === embarque?.bl))
      );
    });

    const uniqueContainers = [...new Set(
      matchedRows.map((item) => item?.Contenedor?.contenedor).filter(Boolean)
    )];
    const totalBoxes = matchedRows.reduce((acc, item) => acc + Number(item?.cajas_unidades || 0), 0);

    return {
      key: buildGroupKey(embarque),
      embarque,
      listados: matchedRows,
      uniqueContainers,
      totalBoxes,
    };
  }).filter((group) => group.listados.length > 0);
};

export default function CartasAntinarcoticos() {
  const { getUser } = useAuth();
  const user = getUser();
  const isSuperAdmin = user?.id_rol === 'Super administrador';

  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weekInput, setWeekInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState({});
  const [templateConfig, setTemplateConfig] = useState(normalizeCartaConfig());
  const [envioConfig, setEnvioConfig] = useState({ destinatarios: '', selloProducto: '' });
  const [securityProducts, setSecurityProducts] = useState([]);
  const [draftDestinatarios, setDraftDestinatarios] = useState('');
  const [draftSelloProducto, setDraftSelloProducto] = useState('');
  const [openConfig, setOpenConfig] = useState(false);
  const [sendMode, setSendMode] = useState('attachments');

  const recipients = useMemo(
    () => parseRecipients(envioConfig.destinatarios),
    [envioConfig.destinatarios]
  );

  const selectedShipmentGroups = useMemo(
    () => groups.filter((group) => selectedGroups[group.key]),
    [groups, selectedGroups]
  );

  const serialProducts = useMemo(
    () => (Array.isArray(securityProducts) ? securityProducts : []).filter((item) => Boolean(item?.serial)),
    [securityProducts]
  );

  const selectedSelloProductName = useMemo(() => {
    const selectedProduct = serialProducts.find(
      (item) => String(item?.consecutivo || '') === String(envioConfig.selloProducto || '')
    );

    return selectedProduct?.name || selectedProduct?.nombre || '';
  }, [envioConfig.selloProducto, serialProducts]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [weeksRes, cartaRes, envioRes, productsRes] = await Promise.all([
          listarSemanas(),
          encontrarModulo(CARTA_MODULE).catch(() => []),
          encontrarModulo(ENVIO_MODULE).catch(() => []),
          listarProductosSeguridad().catch(() => []),
        ]);

        const sortedWeeks = [...(weeksRes || [])].sort((a, b) =>
          String(b?.consecutivo || '').localeCompare(String(a?.consecutivo || ''))
        );

        const normalizedTemplate = normalizeCartaConfig(cartaRes?.[0]?.detalles);
        const normalizedEnvio = normalizeEnvioConfig(envioRes?.[0]?.detalles || envioRes?.[0]?.email_reporte);

        setWeeks(sortedWeeks);
        setTemplateConfig(normalizedTemplate);
        setEnvioConfig(normalizedEnvio);
        setSecurityProducts(Array.isArray(productsRes) ? productsRes : []);
        setDraftDestinatarios(normalizedEnvio.destinatarios || '');
        setDraftSelloProducto(normalizedEnvio.selloProducto || '');
      } catch (error) {
        console.error('Error cargando configuración de cartas:', error);
        window.alert('No fue posible cargar la configuración inicial de las cartas.');
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedWeek) {
      setGroups([]);
      setSelectedGroups({});
      return;
    }

    const loadWeekData = async () => {
      try {
        setLoading(true);
        const [embarquesRes, listadoRes] = await Promise.all([
          paginarEmbarques(1, 1000, { semana: selectedWeek }),
          paginarListado(1, 5000, { semana: selectedWeek, habilitado: true }),
        ]);

        const activeRows = filterActiveContainerRows(listadoRes?.data || []).filter(
          (item) => item?.Embarque?.semana?.consecutivo === selectedWeek
        );
        const grouped = buildShipmentGroups(embarquesRes?.data || [], activeRows);

        setGroups(grouped);
        setSelectedGroups(
          grouped.reduce((acc, group) => {
            acc[group.key] = true;
            return acc;
          }, {})
        );
      } catch (error) {
        console.error('Error cargando embarques de la semana:', error);
        setGroups([]);
        setSelectedGroups({});
        window.alert('No fue posible cargar los embarques de la semana seleccionada.');
      } finally {
        setLoading(false);
      }
    };

    loadWeekData();
  }, [selectedWeek]);

  const handleSearchWeek = () => {
    const normalizedWeek = String(weekInput || '').trim();

    if (!normalizedWeek) {
      setSelectedWeek('');
      setGroups([]);
      setSelectedGroups({});
      return;
    }

    const existsWeek = weeks.some(
      (week) => String(week?.consecutivo || '').trim().toUpperCase() === normalizedWeek.toUpperCase()
    );

    if (!existsWeek) {
      window.alert('Selecciona una semana valida de la lista.');
      return;
    }

    setSelectedWeek(normalizedWeek);
  };

  const handleToggleAll = (checked) => {
    setSelectedGroups(
      groups.reduce((acc, group) => {
        acc[group.key] = checked;
        return acc;
      }, {})
    );
  };

  const handleSaveDestinatarios = async () => {
    try {
      await actualizarModulo({
        modulo: ENVIO_MODULE,
        detalles: JSON.stringify({
          destinatarios: draftDestinatarios,
          selloProducto: draftSelloProducto,
        }),
      });
      setEnvioConfig({
        destinatarios: draftDestinatarios,
        selloProducto: draftSelloProducto,
      });
      setOpenConfig(false);
      window.alert('La configuracion de envio se guardo correctamente.');
    } catch (error) {
      console.error('Error guardando destinatarios de cartas:', error);
      window.alert('No fue posible guardar la configuracion de envio.');
    }
  };

  const handleSend = async () => {
    if (!selectedWeek) {
      window.alert('Selecciona una semana antes de enviar.');
      return;
    }

    if (selectedShipmentGroups.length === 0) {
      window.alert('Selecciona al menos un embarque para enviar.');
      return;
    }

    if (recipients.length === 0) {
      window.alert('Configura los destinatarios antes de enviar.');
      return;
    }

    try {
      setSending(true);
      const results = [];

      for (const group of selectedShipmentGroups) {
        const cartaBase = buildCartaAntinarcoticosData({
          config: templateConfig,
          embarque: group.embarque,
          listados: group.listados,
        });
        const carta = {
          ...cartaBase,
          urlLogo: await resolveLogoForPdf(cartaBase?.urlLogo),
        };

        const pdfBlob = await pdf(<CartaAntinarcoticosPDF carta={carta} />).toBlob();
        const pdfBytes = await blobToArrayBuffer(pdfBlob);
        const excelRows = buildCartaListadoRows({
          carta,
          listados: group.listados,
          selloProducto: envioConfig.selloProducto,
        });
        const excelBuffer = await generateCartaAntinarcoticosExcelBuffer(excelRows);
        const baseName = buildCartaZipBaseName({ semana: selectedWeek, embarque: carta.embarque });
        let correoPayload = {
          destinatario: recipients.join(','),
          asunto: buildCartaAntinarcoticosMailSubject({
            semana: selectedWeek,
            embarque: carta.embarque,
          }),
          cuerpo: buildCartaAntinarcoticosMailHtml({
            semana: selectedWeek,
            carta,
          }),
        };

        if (sendMode === 'zip') {
          const zip = new JSZip();
          zip.file(`${baseName}.pdf`, pdfBytes);
          zip.file(`Listado_${baseName}.xlsx`, excelBuffer);

          const zipBase64 = await zip.generateAsync({ type: 'base64' });
          correoPayload = {
            ...correoPayload,
            archivo: {
              nombre: `${baseName}.zip`,
              contenido: zipBase64,
              tipo: 'application/zip',
            },
          };
        } else {
          const pdfBase64 = btoa(
            Array.from(pdfBytes).map((byte) => String.fromCharCode(byte)).join('')
          );
          const excelBase64 = btoa(
            new Uint8Array(excelBuffer).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
          );

          correoPayload = {
            ...correoPayload,
            archivos: [
              {
                nombre: `${baseName}.pdf`,
                contenido: pdfBase64,
                tipo: 'application/pdf',
              },
              {
                nombre: `Listado_${baseName}.xlsx`,
                contenido: excelBase64,
                tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              },
            ],
          };
        }

        const response = await enviarCorreo(correoPayload);

        results.push({
          anuncio: carta.embarque.numAnuncio,
          booking: carta.embarque.bl,
          success: Boolean(response?.success),
        });
      }

      const successCount = results.filter((item) => item.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        window.alert(`Se enviaron ${successCount} correos correctamente.`);
        return;
      }

      const failedItems = results
        .filter((item) => !item.success)
        .map((item) => `Anuncio ${item.anuncio || 'N/A'} / Booking ${item.booking || 'N/A'}`)
        .join('\n');

      window.alert(
        `Se enviaron ${successCount} correos correctamente y ${failCount} fallaron.\n${failedItems}`
      );
    } catch (error) {
      console.error('Error enviando cartas antinarcóticos:', error);
      window.alert(`No fue posible completar el envío: ${error?.message || 'Error desconocido.'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="container-fluid px-0">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
          <div>
            <h2 className="mb-1">Cartas antinarcóticos</h2>
            <div className="text-muted">
              Selecciona una semana y envía un correo por embarque con la carta y el listado de contenedores.
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button variant="outline-secondary" size="sm" onClick={() => setOpenConfig(true)}>
                <FaCog className="me-2" />
                Destinatarios
              </Button>
            )}
            <Button
              as="a"
              href="/cartas/redaccion"
              target="_blank"
              rel="noreferrer"
              variant="outline-primary"
              size="sm"
            >
              <FaExternalLinkAlt className="me-2" />
              Configurar plantilla
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={4} lg={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Semana</Form.Label>
                  <Form.Control
                    type="text"
                    list="cartas-antinarcoticos-semanas"
                    value={weekInput}
                    onChange={(event) => setWeekInput(event.target.value)}
                    placeholder="Busca o selecciona una semana"
                  />
                  <datalist id="cartas-antinarcoticos-semanas">
                    {weeks.map((week) => (
                      <option key={week.id || week.consecutivo} value={week.consecutivo}>
                        {week.consecutivo}
                      </option>
                    ))}
                  </datalist>
                </Form.Group>
              </Col>

              <Col xs={12} md={8} lg={6}>
                <div className="small text-muted mb-1">Destinatarios configurados</div>
                <div className="d-flex flex-wrap gap-2">
                  {recipients.length > 0 ? (
                    recipients.map((email) => (
                      <Badge bg="secondary" key={email} className="fw-normal">
                        {email}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted">No hay destinatarios configurados.</span>
                  )}
                </div>
                <div className="small text-muted mt-2">
                  Sello configurado:{' '}
                  <span className="fw-semibold text-dark">
                    {selectedSelloProductName || 'Ultimo serial disponible'}
                  </span>
                </div>
              </Col>

              <Col xs={12} md={6} lg={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Formato de envío</Form.Label>
                  <Form.Select value={sendMode} onChange={(event) => setSendMode(event.target.value)}>
                    <option value="zip">ZIP</option>
                    <option value="attachments">Adjuntos separados</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} md={6} lg={1} className="d-grid">
                <Button
                  variant="outline-primary"
                  onClick={handleSearchWeek}
                  disabled={loading}
                >
                  <FaSearch className="me-2" />
                  Buscar
                </Button>
              </Col>

              <Col xs={12} md={6} lg={2} className="d-grid">
                <Button
                  onClick={handleSend}
                  disabled={sending || loading || selectedShipmentGroups.length === 0}
                >
                  <FaPaperPlane className="me-2" />
                  {sending ? 'Enviando...' : 'Enviar seleccionados'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2 mb-3">
              <div className="fw-semibold">Embarques encontrados</div>
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted small">
                  {groups.length} embarques | {selectedShipmentGroups.length} seleccionados
                </span>
                <Form.Check
                  type="checkbox"
                  id="select-all-cartas"
                  label="Seleccionar todos"
                  checked={groups.length > 0 && selectedShipmentGroups.length === groups.length}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <Table bordered hover responsive className="align-middle text-center mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Sel</th>
                    <th>Semana</th>
                    <th>Anuncio</th>
                    <th>Booking</th>
                    <th>Buque</th>
                    <th>Destino</th>
                    <th>Contenedores</th>
                    <th>Cajas</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} className="py-4 text-muted">Cargando embarques...</td>
                    </tr>
                  )}

                  {!loading && groups.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-muted">
                        {selectedWeek
                          ? 'No se encontraron embarques con listado para esa semana.'
                          : 'Busca una semana para cargar la información.'}
                      </td>
                    </tr>
                  )}

                  {!loading && groups.map((group) => (
                    <tr key={group.key}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={Boolean(selectedGroups[group.key])}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelectedGroups((prev) => ({ ...prev, [group.key]: checked }));
                          }}
                        />
                      </td>
                      <td>{selectedWeek}</td>
                      <td>{group.embarque?.anuncio || group.embarque?.sae || 'N/A'}</td>
                      <td>{group.embarque?.booking || group.embarque?.bl || 'N/A'}</td>
                      <td>{group.embarque?.Buque?.buque || 'No registrado'}</td>
                      <td>{group.embarque?.Destino?.destino || group.embarque?.Destino?.cod || 'No registrado'}</td>
                      <td>{group.uniqueContainers.length}</td>
                      <td>{group.totalBoxes}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Modal show={openConfig} onHide={() => setOpenConfig(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Configuracion de envio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Correos separados por coma</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={draftDestinatarios}
                  onChange={(event) => setDraftDestinatarios(event.target.value)}
                  placeholder="correo1@empresa.com, correo2@empresa.com"
                />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Articulo para la columna SELLO</Form.Label>
                <Form.Select
                  value={draftSelloProducto}
                  onChange={(event) => setDraftSelloProducto(event.target.value)}
                >
                  <option value="">Ultimo serial disponible</option>
                  {serialProducts.map((product) => (
                    <option key={product.consecutivo} value={product.consecutivo}>
                      {product.name || product.nombre}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Si eliges un articulo, el Excel usara el ultimo serial actualizado de ese producto.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setOpenConfig(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveDestinatarios}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
