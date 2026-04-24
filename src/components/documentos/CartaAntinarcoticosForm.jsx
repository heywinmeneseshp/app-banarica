import React, { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';

import CartaAntinarcoticosPDF from '@components/documentos/CartaAntinarcoticosPDF';
import useCartaAntinarcoticos from '@hooks/useCartaAntinarcoticos';
import { getAppBaseUrl } from '@utils/appUrl';

const EMBARQUE_FIELDS = [
  ['agenciaAduanas', 'Agencia de aduanas'],
  ['nitAgenciaAduanas', 'NIT agencia de aduanas'],
  ['vuce', 'VUCE'],
  ['ciudadOrigenMercancia', 'Ciudad origen mercancia']
];

const fileToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const compressImageToDataUrl = async (file) => {
  const originalDataUrl = await fileToDataUrl(file);
  const image = await loadImage(originalDataUrl);

  const maxWidth = 320;
  const scale = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

  while (compressedDataUrl.length > 45000 && quality > 0.4) {
    quality -= 0.08;
    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (compressedDataUrl.length > 60000) {
    throw new Error('La imagen sigue siendo muy pesada incluso despues de comprimirla.');
  }

  return compressedDataUrl;
};

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
    console.warn('No fue posible incrustar el logo para el PDF.', error);
    return absoluteSource;
  }
};

const CartaAntinarcoticosForm = () => {
  const {
    empresa,
    destinatario,
    signatory,
    embarque,
    urlLogo,
    logoDataUrl,
    guardarConfiguracion,
    loading,
    isInitialized,
    error
  } = useCartaAntinarcoticos();

  const [formState, setFormState] = useState({
    empresa: {},
    destinatario: {},
    signatory: {},
    embarque: {},
    urlLogo: '',
    logoDataUrl: ''
  });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const previewUrlRef = useRef('');

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    setFormState({
      empresa: empresa || {},
      destinatario: destinatario || {},
      signatory: signatory || {},
      embarque: embarque || {},
      urlLogo: urlLogo || '',
      logoDataUrl: logoDataUrl || ''
    });
  }, [empresa, destinatario, signatory, embarque, urlLogo, logoDataUrl, isInitialized]);

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  const updateSection = (section, name, value) => {
    setFormState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  const handleChangeEmpresa = (e) => {
    const { name, value } = e.target;
    updateSection('empresa', name, value);
  };

  const handleChangeDestinatario = (e) => {
    const { name, value } = e.target;
    updateSection('destinatario', name, value);
  };

  const handleChangeSignatory = (e) => {
    const { name, value } = e.target;
    updateSection('signatory', name, value);
  };

  const handleChangeEmbarque = (e) => {
    const { name, value } = e.target;
    updateSection('embarque', name, value);
  };

  const handleChangeLogo = (e) => {
    const { value } = e.target;
    setFormState((prev) => ({ ...prev, urlLogo: value }));
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const logoAsDataUrl = await compressImageToDataUrl(file);
      setFormState((prev) => ({
        ...prev,
        logoDataUrl: logoAsDataUrl,
      }));
    } catch (fileError) {
      console.error('Error leyendo logo local:', fileError);
      window.alert(fileError?.message || 'No fue posible cargar el archivo del logo.');
    }
  };

  const buildCartaData = async () => {
    const fechaEmision = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      fechaEmision,
      empresa: formState.empresa,
      destinatario: formState.destinatario,
      signatory: formState.signatory,
      urlLogo: formState.logoDataUrl || await resolveLogoForPdf(formState.urlLogo),
      logoDataUrl: formState.logoDataUrl,
      embarque: {
        ...formState.embarque,
        destinoFinal: formState.embarque?.puertoDestino,
        porcentajeVacio: 'cero porcentajes vacios',
        direccionImportador: formState.embarque?.direccionImportador || '[Direccion del Importador - Pendiente de ingreso]',
        telefonoImportador: formState.embarque?.telefonoImportador || '[Telefono del Importador - Pendiente de ingreso]',
        vuce: formState.embarque?.vuce || '[Pendiente]'
      }
    };
  };

  const generarCarta = async () => {
    const carta = await buildCartaData();
    const blob = await pdf(<CartaAntinarcoticosPDF carta={carta} />).toBlob();
    const nextUrl = URL.createObjectURL(blob);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    previewUrlRef.current = nextUrl;
    setPdfPreviewUrl(nextUrl);
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await guardarConfiguracion(formState);
      await generarCarta();
      window.alert('Configuracion guardada correctamente.');
    } catch (saveError) {
      console.error('Error guardando configuracion de carta:', saveError);
      window.alert(saveError?.message || 'No fue posible guardar la configuracion.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    try {
      await generarCarta();
    } catch (previewError) {
      console.error('Error generando vista previa PDF:', previewError);
      window.alert('No fue posible generar la vista previa en PDF.');
    }
  };

  const handlePrint = () => {
    if (!pdfPreviewUrl) return;

    const printWindow = window.open(pdfPreviewUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div className="row g-4">
      {loading && !isInitialized && (
        <div className="col-12 text-muted">Cargando configuracion...</div>
      )}

      {error && (
        <div className="col-12">
          <div className="alert alert-warning mb-0" role="alert">
            {error}
          </div>
        </div>
      )}

      <div className="col-12 col-xl-6">
        <form onSubmit={handleGenerate}>
          <div className="card shadow-sm mb-4 border-primary">
            <div className="card-body p-4">
              <h4 className="card-title text-primary">Datos de la empresa exportadora</h4>
              <p className="text-muted small mb-4">Esta configuracion se carga automaticamente al abrir la pagina.</p>

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="exportador" className="form-label">Nombre de la empresa</label>
                  <input type="text" className="form-control" id="exportador" name="exportador" value={formState.empresa?.exportador || ''} onChange={handleChangeEmpresa} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="nit" className="form-label">NIT</label>
                  <input type="text" className="form-control" id="nit" name="nit" value={formState.empresa?.nit || ''} onChange={handleChangeEmpresa} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="telefonoExportador" className="form-label">Telefono</label>
                  <input type="text" className="form-control" id="telefonoExportador" name="telefonoExportador" value={formState.empresa?.telefonoExportador || ''} onChange={handleChangeEmpresa} required />
                </div>
                <div className="col-md-7">
                  <label htmlFor="direccionExportador" className="form-label">Direccion</label>
                  <input type="text" className="form-control" id="direccionExportador" name="direccionExportador" value={formState.empresa?.direccionExportador || ''} onChange={handleChangeEmpresa} required />
                </div>
                <div className="col-md-5">
                  <label htmlFor="ciudadEmision" className="form-label">Ciudad de emision</label>
                  <input type="text" className="form-control" id="ciudadEmision" name="ciudadEmision" value={formState.empresa?.ciudadEmision || ''} onChange={handleChangeEmpresa} required />
                </div>
                <div className="col-12">
                  <label htmlFor="logoUrl" className="form-label">URL del logo</label>
                  <input type="url" className="form-control" id="logoUrl" name="logoUrl" value={formState.urlLogo || ''} onChange={handleChangeLogo} placeholder="https://..." required />
                </div>
                <div className="col-12">
                  <label htmlFor="logoFile" className="form-label">O cargar logo desde archivo</label>
                  <input type="file" className="form-control" id="logoFile" accept="image/*" onChange={handleLogoFileChange} />
                  {formState.logoDataUrl && (
                    <div className="form-text text-success">Logo embebido listo para guardarse en la configuracion.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4 border-danger">
            <div className="card-body p-4">
              <h4 className="card-title text-danger">Datos del destinatario</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="destinatarioPrincipal" className="form-label">Destinatario principal</label>
                  <input type="text" className="form-control" id="destinatarioPrincipal" name="destinatarioPrincipal" value={formState.destinatario?.destinatarioPrincipal || ''} onChange={handleChangeDestinatario} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="departamento" className="form-label">Departamento o compania</label>
                  <input type="text" className="form-control" id="departamento" name="departamento" value={formState.destinatario?.departamento || ''} onChange={handleChangeDestinatario} required />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4 border-success">
            <div className="card-body p-4">
              <h4 className="card-title text-success">Datos del firmante</h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="nombreRepresentante" className="form-label">Nombre del representante</label>
                  <input type="text" className="form-control" id="nombreRepresentante" name="nombreRepresentante" value={formState.signatory?.nombreRepresentante || ''} onChange={handleChangeSignatory} required />
                </div>
                <div className="col-md-3">
                  <label htmlFor="cedula" className="form-label">Cedula</label>
                  <input type="text" className="form-control" id="cedula" name="cedula" value={formState.signatory?.cedula || ''} onChange={handleChangeSignatory} required />
                </div>
                <div className="col-md-3">
                  <label htmlFor="celular" className="form-label">Celular</label>
                  <input type="text" className="form-control" id="celular" name="celular" value={formState.signatory?.celular || ''} onChange={handleChangeSignatory} />
                </div>
                <div className="col-12">
                  <label htmlFor="cargo" className="form-label">Cargo</label>
                  <input type="text" className="form-control" id="cargo" name="cargo" value={formState.signatory?.cargo || ''} onChange={handleChangeSignatory} required />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body p-4">
              <h4 className="card-title text-secondary">Datos base del embarque</h4>
              <div className="row g-3">
                {EMBARQUE_FIELDS.map(([field, label]) => (
                  <div key={field} className={field === 'mercanciaCantidad' ? 'col-12' : 'col-md-6'}>
                    <label htmlFor={field} className="form-label">{label}</label>
                    <input
                      type="text"
                      className="form-control"
                      id={field}
                      name={field}
                      value={formState.embarque?.[field] || ''}
                      onChange={handleChangeEmbarque}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row gap-2 justify-content-end">
                <button type="button" className="btn btn-outline-primary" onClick={handleSaveConfig} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar configuracion'}
                </button>
                <button type="submit" className="btn btn-primary">
                  Generar vista previa
                </button>
                <button type="button" onClick={handlePrint} className="btn btn-success" disabled={!pdfPreviewUrl}>
                  Imprimir / PDF
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="col-12 col-xl-6">
        <div className="card shadow-sm bg-light h-100">
          <div className="card-body p-4">
            <h4 className="card-title">Vista previa de la carta antinarcoticos</h4>
            <hr />
            {pdfPreviewUrl ? (
              <div className="border rounded overflow-hidden bg-white" style={{ minHeight: '900px' }}>
                <iframe
                  title="Vista previa PDF carta antinarcoticos"
                  src={pdfPreviewUrl}
                  className="w-100 border-0"
                  style={{ minHeight: '900px' }}
                />
              </div>
            ) : (
              <div className="text-center text-muted py-5">
                <p>La pagina carga la configuracion guardada. Cuando hagas cambios, puedes guardarlos y luego generar la vista previa.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartaAntinarcoticosForm;
