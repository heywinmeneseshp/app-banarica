export const CARTA_ANTINARCOTICOS_DEFAULTS = {
  empresa: {
    exportador: 'EMPRESA EJEMPLO S.A.S.',
    nit: '800.000.000-0',
    direccionExportador: 'Calle Falsa 123, Edificio Empresarial',
    telefonoExportador: '6051234567',
    ciudadEmision: 'Santa Marta',
  },
  destinatario: {
    destinatarioPrincipal: 'POLICIA ANTINARCOTICOS',
    departamento: 'COMPANIA ANTINARCOTICOS CONTROL PORTUARIO SANTA MARTA',
  },
  signatory: {
    nombreRepresentante: 'NOMBRE DEL FIRMANTE',
    cedula: '1.000.000.000',
    cargo: 'CARGO DEL FIRMANTE',
    celular: '3000000000',
  },
  embarque: {
    numAnuncio: '',
    motonave: '',
    viaje: '',
    puertoDestino: '',
    cantCajas: '0',
    cantContenedores: '0',
    bl: '',
    pesoNeto: '0',
    pesoBruto: '0',
    nombreImportador: '',
    nitAgenciaAduanas: '',
    direccionImportador: '',
    telefonoImportador: '',
    mercanciaCantidad: '0 pallets conteniendo producto.',
    agenciaAduanas: 'AGENCIA DE ADUANAS',
    vuce: '',
    ciudadOrigenMercancia: 'ZONA BANANERA - MAGDALENA COLOMBIA',
  },
  urlLogo: '',
  logoDataUrl: '',
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const cleanText = (value) => String(value || '').trim();

const formatInteger = (value) => String(Math.round(toNumber(value)));

const formatRowDate = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    if (value.includes('T')) {
      return value.split('T')[0];
    }

    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const normalizeCartaConfig = (source) => {
  let parsed = source;

  if (typeof source === 'string') {
    try {
      parsed = JSON.parse(source);
    } catch (error) {
      parsed = {};
    }
  }

  return {
    empresa: {
      ...CARTA_ANTINARCOTICOS_DEFAULTS.empresa,
      ...(parsed?.datosEmpresa || parsed?.empresa || {}),
    },
    destinatario: {
      ...CARTA_ANTINARCOTICOS_DEFAULTS.destinatario,
      ...(parsed?.datosDestinatario || parsed?.destinatario || {}),
    },
    signatory: {
      ...CARTA_ANTINARCOTICOS_DEFAULTS.signatory,
      ...(parsed?.datosSignatory || parsed?.signatory || {}),
    },
    embarque: {
      ...CARTA_ANTINARCOTICOS_DEFAULTS.embarque,
      ...(parsed?.datosEmbarque || parsed?.embarque || {}),
    },
    urlLogo: parsed?.urlLogo || CARTA_ANTINARCOTICOS_DEFAULTS.urlLogo,
    logoDataUrl: parsed?.logoDataUrl || CARTA_ANTINARCOTICOS_DEFAULTS.logoDataUrl,
  };
};

export const buildCartaConfigPayload = (config) => ({
  modulo: 'cartaAntinarcoticos',
  detalles: JSON.stringify({
    datosEmpresa: config.empresa,
    datosDestinatario: config.destinatario,
    datosSignatory: config.signatory,
    datosEmbarque: config.embarque,
    urlLogo: config.urlLogo,
    logoDataUrl: config.logoDataUrl,
  }),
});

const getRowProductName = (row) =>
  cleanText(row?.combo?.nombre || row?.Combo?.nombre || row?.Producto?.name);

const getLatestSerialForProduct = (seriales = [], consProducto) => {
  const filtered = (Array.isArray(seriales) ? seriales : []).filter(
    (item) => String(item?.cons_producto || '') === String(consProducto || '')
  );

  if (filtered.length === 0) {
    return '';
  }

  const ordered = [...filtered].sort((a, b) => {
    const aDate = new Date(a?.updatedAt || a?.fecha_de_uso || a?.createdAt || 0).getTime();
    const bDate = new Date(b?.updatedAt || b?.fecha_de_uso || b?.createdAt || 0).getTime();

    if (aDate !== bDate) {
      return bDate - aDate;
    }

    return Number(b?.id || 0) - Number(a?.id || 0);
  });

  return cleanText(ordered[0]?.serial);
};

const getRowSeal = (row, selloProducto) => {
  const seriales = row?.serial_de_articulos || [];

  if (!Array.isArray(seriales) || seriales.length === 0) {
    return '';
  }

  if (selloProducto) {
    return getLatestSerialForProduct(seriales, selloProducto);
  }

  return cleanText(seriales[seriales.length - 1]?.serial || seriales.find((item) => item?.serial)?.serial);
};

const getPalletsForRow = (row) => {
  const cajas = toNumber(row?.cajas_unidades);
  const cajasPorPalet = toNumber(row?.combo?.cajas_por_palet || row?.Combo?.cajas_por_palet);

  if (!cajas || !cajasPorPalet) {
    return 0;
  }

  return Math.ceil(cajas / cajasPorPalet);
};

const getPesoNetoForRow = (row) => {
  const cajas = toNumber(row?.cajas_unidades);
  const pesoPorCaja = toNumber(row?.combo?.peso_neto || row?.Combo?.peso_neto);
  return cajas * pesoPorCaja;
};

const getPesoBrutoForRow = (row) => {
  const cajas = toNumber(row?.cajas_unidades);
  const pesoPorCaja = toNumber(row?.combo?.peso_bruto || row?.Combo?.peso_bruto);
  return cajas * pesoPorCaja;
};

export const buildCartaAntinarcoticosData = ({ config, embarque, listados }) => {
  const mergedConfig = normalizeCartaConfig(config);
  const rows = Array.isArray(listados) ? listados : [];

  const uniqueDestinos = unique(
    rows.map((item) => cleanText(item?.Embarque?.Destino?.destino || item?.Embarque?.Destino?.cod))
  );
  const uniquePaises = unique(
    rows.map((item) => cleanText(item?.Embarque?.Destino?.destino || item?.Embarque?.Destino?.cod))
  );
  const uniqueContenedores = unique(rows.map((item) => cleanText(item?.Contenedor?.contenedor)));
  const productos = unique(rows.map(getRowProductName));

  const cajasTotales = rows.reduce((acc, item) => acc + toNumber(item?.cajas_unidades), 0);
  const palletsTotales = rows.reduce((acc, item) => acc + getPalletsForRow(item), 0);
  const pesoNetoTotal = rows.reduce((acc, item) => acc + getPesoNetoForRow(item), 0);
  const pesoBrutoTotal = rows.reduce((acc, item) => acc + getPesoBrutoForRow(item), 0);

  const importador =
    cleanText(embarque?.cliente?.razon_social)
    || cleanText(embarque?.cliente?.nombre)
    || cleanText(embarque?.cliente?.cod)
    || cleanText(mergedConfig.embarque.nombreImportador);

  const puertoDestino =
    uniqueDestinos.join(', ')
    || cleanText(embarque?.Destino?.destino)
    || cleanText(embarque?.Destino?.cod)
    || cleanText(mergedConfig.embarque.puertoDestino);

  const mercanciaDescripcion =
    productos.length > 0
      ? `${formatInteger(palletsTotales)} pallets conteniendo ${productos.join(', ')}.`
      : mergedConfig.embarque.mercanciaCantidad;

  return {
    fechaEmision: formatDate(new Date()),
    empresa: mergedConfig.empresa,
    destinatario: mergedConfig.destinatario,
    signatory: mergedConfig.signatory,
    urlLogo: mergedConfig.logoDataUrl || mergedConfig.urlLogo,
    embarque: {
      ...mergedConfig.embarque,
      numAnuncio: cleanText(embarque?.anuncio || embarque?.sae || mergedConfig.embarque.numAnuncio),
      motonave: cleanText(embarque?.Buque?.buque || mergedConfig.embarque.motonave),
      viaje: cleanText(embarque?.viaje || mergedConfig.embarque.viaje),
      puertoDestino,
      destinoFinal: puertoDestino,
      cantCajas: formatInteger(cajasTotales),
      cantContenedores: formatInteger(uniqueContenedores.length),
      bl: cleanText(embarque?.booking || embarque?.bl || mergedConfig.embarque.bl),
      pesoNeto: formatInteger(pesoNetoTotal),
      pesoBruto: formatInteger(pesoBrutoTotal),
      nombreImportador: importador,
      mercanciaCantidad: mercanciaDescripcion,
      agenciaAduanas: cleanText(mergedConfig.embarque.agenciaAduanas),
      nitAgenciaAduanas: cleanText(mergedConfig.embarque.nitAgenciaAduanas),
      vuce: cleanText(mergedConfig.embarque.vuce),
      ciudadOrigenMercancia: cleanText(mergedConfig.embarque.ciudadOrigenMercancia),
      direccionImportador: cleanText(
        embarque?.cliente?.domicilio
        || embarque?.cliente?.direccion
        || mergedConfig.embarque.direccionImportador
      ),
      telefonoImportador: cleanText(embarque?.cliente?.telefono || mergedConfig.embarque.telefonoImportador),
      porcentajeVacio: 'cero porcentajes vacios',
      paisesDestino: uniquePaises.join(', '),
    },
    resumen: {
      contenedores: uniqueContenedores.length,
      cajas: cajasTotales,
      pallets: palletsTotales,
      pesoNeto: pesoNetoTotal,
      pesoBruto: pesoBrutoTotal,
      destinos: uniqueDestinos,
    },
  };
};

export const buildCartaAntinarcoticosMailHtml = ({ semana, carta }) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 720px;">
    <p>Buen día,</p>
    <p>
      Se adjuntan los documentos correspondientes a la
      <strong> carta de responsabilidad antinarcóticos</strong> del embarque relacionado a continuación.
    </p>
    <div style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Semana:</strong> ${cleanText(semana)}</p>
      <p style="margin: 0 0 8px;"><strong>Anuncio:</strong> ${cleanText(carta?.embarque?.numAnuncio)}</p>
      <p style="margin: 0 0 8px;"><strong>Booking:</strong> ${cleanText(carta?.embarque?.bl)}</p>
      <p style="margin: 0 0 8px;"><strong>Motonave:</strong> ${cleanText(carta?.embarque?.motonave)}</p>
      <p style="margin: 0;"><strong>Destino:</strong> ${cleanText(carta?.embarque?.puertoDestino)}</p>
    </div>
    <p>
      Documentos adjuntos:
    </p>
    <ul>
      <li>La carta en formato PDF.</li>
      <li>El listado de contenedores del embarque en formato Excel.</li>
    </ul>
    <p>Atentamente,<br><strong>Logística Bana Rica</strong></p>
  </div>
`;

export const buildCartaAntinarcoticosMailSubject = ({ semana, embarque }) =>
  `Carta antinarcoticos - ${cleanText(semana)} - Anuncio ${cleanText(embarque?.numAnuncio)} - Booking ${cleanText(embarque?.bl)}`;

export const buildCartaZipBaseName = ({ semana, embarque }) =>
  [
    'CartaAntinarcoticos',
    cleanText(semana).replace(/\s+/g, '_'),
    `Anuncio_${cleanText(embarque?.numAnuncio || 'NA')}`,
    `Booking_${cleanText(embarque?.bl || 'NA')}`,
  ]
    .filter(Boolean)
    .join('_')
    .replace(/[^\w.-]+/g, '_');

export const buildCartaListadoRows = ({ carta, listados, selloProducto }) =>
  (Array.isArray(listados) ? listados : []).map((row) => ({
    fecha: formatRowDate(row?.fecha),
    anuncio: carta?.embarque?.numAnuncio || '',
    linea: row?.Embarque?.Naviera?.navieras || row?.Embarque?.Naviera?.cod || '',
    booking: carta?.embarque?.bl || '',
    buque: carta?.embarque?.motonave || '',
    destino: row?.Embarque?.Destino?.destino || row?.Embarque?.Destino?.cod || carta?.embarque?.puertoDestino || '',
    fincaPuerto: row?.almacen?.nombre || '',
    contenedor: row?.Contenedor?.contenedor || '',
    sello: getRowSeal(row, selloProducto),
    cajasTotales: toNumber(row?.cajas_unidades),
    pallets: getPalletsForRow(row),
    pesoNeto: getPesoNetoForRow(row),
    pesoBruto: getPesoBrutoForRow(row),
    carga: productosToDisplay(getRowProductName(row)),
    exportador: carta?.empresa?.exportador || '',
    nitExportador: carta?.empresa?.nit || '',
    agenciaAduanas: carta?.embarque?.agenciaAduanas || '',
    nitAgenciaAduanas: carta?.embarque?.nitAgenciaAduanas || '',
    consignatario: carta?.embarque?.nombreImportador || '',
  }));

function productosToDisplay(value) {
  return cleanText(value) || 'BANANA CAVENDISH';
}
