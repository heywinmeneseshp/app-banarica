import React, { useState } from 'react';

// --- DATOS INICIALES (Todos mutables ahora) ---

const DATOS_EMPRESA_INICIAL = {
  exportador: 'C.I. BANA RICA S.A.',
  nit: '900.261.404-6',
  direccionExportador: 'Carrera 1ra A N° 22-58 oficina 404 Edificio Bahía Centro Sta. Mta-Mag-Col',
  telefonoExportador: '54315918',
  ciudadEmision: 'Santa Marta', // Ciudad para la fecha
};

const DATOS_DESTINATARIO_INICIAL = {
  destinatarioPrincipal: 'POLICIA ANTINARCOTICOS',
  departamento: 'COMPAÑÍA ANTINARCOTICOS CONTROL PORTUARIO SANTA MARTA',
};

const DATOS_SIGNATORY_INICIAL = {
  nombreRepresentante: 'JENNIFER ANDREA TAITE ESCORCIA',
  cedula: '1.082.877.938',
  cargo: 'DIRECTORA LOGISTICA',
  celular: '3218113025',
};

const DATOS_EMBARQUE_INICIAL = {
  numAnuncio: '125583',
  // facturaVenta ELIMINADO
  motonave: 'SANTA MARTA EXPRESS',
  viaje: '548N',
  puertoDestino: 'VLISSINGEN, PAÍSES BAJOS',
  cantCajas: '22874',
  cantContenedores: '20',
  bl: '19570616',
  pesoNeto: '397802',
  pesoBruto: '427744',
  nombreImportador: '(AFC) Afrikanische Frucht-Compagnie GMBH',
  mercanciaCantidad: '420 pallets conteniendo Bananos.',
  agenciaAduanas: 'AGENCIA DE ADUANA BANADUANA LTDA NIVEL 2',
  ciudadOrigenMercancia: 'ZONA BANANERA - MAGDALENA', // Ciudad de Origen
};

const CartaAntinarcoticosForm = () => {
  const [datosEmpresa, setDatosEmpresa] = useState(DATOS_EMPRESA_INICIAL);
  const [datosDestinatario, setDatosDestinatario] = useState(DATOS_DESTINATARIO_INICIAL);
  const [datosSignatory, setDatosSignatory] = useState(DATOS_SIGNATORY_INICIAL);
  const [datosEmbarque, setDatosEmbarque] = useState(DATOS_EMBARQUE_INICIAL);
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/100x50.png?text=Logo+Aqui');
  const [cartaGenerada, setCartaGenerada] = useState('');

  // Manejadores de cambios
  const handleChangeEmpresa = (e) => {
    const { name, value } = e.target;
    setDatosEmpresa(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeDestinatario = (e) => {
    const { name, value } = e.target;
    setDatosDestinatario(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeSignatory = (e) => {
    const { name, value } = e.target;
    setDatosSignatory(prev => ({ ...prev, [name]: value }));
  };
  
  const handleChangeEmbarque = (e) => {
    const { name, value } = e.target;
    setDatosEmbarque(prev => ({ ...prev, [name]: value }));
  };
  
  const handleChangeLogo = (e) => {
    setLogoUrl(e.target.value);
  };
  
  // Función para generar la carta con estilo HTML
  const generarCarta = (e) => {
    e.preventDefault();

    const { 
        exportador, nit, direccionExportador, telefonoExportador, ciudadEmision
    } = datosEmpresa;

    const {
        destinatarioPrincipal, departamento
    } = datosDestinatario;

    const { 
        numAnuncio, motonave, viaje, puertoDestino, cantCajas, 
        cantContenedores, bl, pesoNeto, pesoBruto, nombreImportador, mercanciaCantidad, 
        agenciaAduanas, ciudadOrigenMercancia
    } = datosEmbarque;
    
    const { nombreRepresentante, cedula, cargo, celular } = datosSignatory;
    
    const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Contenido HTML estructurado
    const contenidoHTML = `
<div style="font-family: Arial, sans-serif; font-size: 10pt; padding: 20px; line-height: 1.4;">

    <table style="width: 100%; margin-bottom: 25px; border-collapse: collapse;">
        <tr>
            <td style="width: 70%; vertical-align: top;">
                <p style="margin: 0;">
                    <strong>${exportador}</strong><br/>
                    S.A<br/>
                    ${ciudadEmision}, ${fecha}<br/>
                </p>
            </td>
            <td style="width: 30%; text-align: right; vertical-align: top;">
                <img src="${logoUrl}" alt="Logo de la Empresa" style="max-width: 150px; height: auto;"/>
            </td>
        </tr>
    </table>

    <p style="margin-top: 15px;">
        Señores:<br/>
        ${destinatarioPrincipal}<br/>
        ${departamento}
    </p>

    <p style="margin-top: 15px;"><strong>REF: CARTA DE RESPONSABILIDAD</strong></p>

    <p style="text-align: justify; margin-bottom: 25px;">
        Yo <strong>${nombreRepresentante}</strong> identificado con Cédula de Ciudadanía N° 
        <strong>${cedula}</strong> expedida en ${ciudadEmision}, en condición de representante de la empresa C.I.
        <strong>${exportador}</strong> con Nit <strong>${nit}</strong> certifico que el contenido de la presente carga se
        ajusta a lo declarado en nuestro despacho así:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 9pt;">
        <tr><td style="width: 35%;">NOMBRE DEL EXPORTADOR:</td><td><strong>${exportador}</strong></td></tr>
        <tr><td>DIRECCION DEL EXPORTADOR:</td><td>${direccionExportador}</td></tr>
        <tr><td>TELEFONO DEL EXPORTADOR:</td><td>${telefonoExportador}</td></tr>
        <tr><td>NOMBRE MOTONAVE Y NÚMERO DE VIAJE:</td><td><strong>${motonave} - ${viaje}</strong></td></tr>
        <tr><td>PUERTO DESTINO:</td><td>${puertoDestino}</td></tr>
        <tr><td>DESTINO FINAL DE LA MERCANCIA:</td><td>${puertoDestino}</td></tr>
        <tr><td>PORCENTAJE VACIO:</td><td>cero porcentajes vacíos</td></tr>
        <tr><td>CIUDAD DE ORIGEN DE LA MERCANCIA:</td><td>${ciudadOrigenMercancia} COLOMBIA</td></tr>
        <tr><td>MERCANCIA Y SU CANTIDAD:</td><td>${mercanciaCantidad}</td></tr>
        <tr><td>CANTIDAD CAJAS:</td><td>${cantCajas}</td></tr>
        <tr><td>CONTENEDOR Y SELLOS:</td><td>${cantContenedores} Uds. VER LISTADO ANEXO</td></tr>
        <tr><td>PESO NETO:</td><td>${pesoNeto}</td></tr>
        <tr><td>PESO BRUTO:</td><td>${pesoBruto}</td></tr>
        <tr><td>NOMBRE AGENCIA DE ADUANAS:</td><td>${agenciaAduanas}</td></tr>
        <tr><td>VUCE:</td><td>[Pendiente]</td></tr>
        <tr><td>NUMERO ANUNCIO:</td><td>${numAnuncio}</td></tr>
        <tr><td>NUMERO BOOKING:</td><td>${bl}</td></tr>
        <tr><td>NOMBRE DEL IMPORTADOR:</td><td>${nombreImportador}</td></tr>
        <tr><td>DIRECCIÓN DEL IMPORTADOR:</td><td>[Dirección del Importador - Pendiente de ingreso]</td></tr>
        <tr><td>TELEFONO DEL IMPORTADOR:</td><td>[Teléfono del Importador - Pendiente de ingreso]</td></tr>
    </table>

    <p style="text-align: justify; margin-bottom: 15px;">
        Nos hacemos responsables por el contenido de esta carga ante las autoridades
        colombianas, extranjeras y ante el transportador en caso que se encuentren sustancias o
        elementos narcóticos, explosivos ilícitos ò prohibidos (estipulados en las normas
        internacionales a excepción de aquellos que expresamente se han declarado como tal),
        armas o partes de ellas, municiones, material de guerra o sus partes u otros elementos que
        no cumplan con las obligaciones legales establecidas para este tipo de carga, siempre que se conserve sus empaques,
        características y sellos originales con las que sea entregada al transportador.
    </p>
    
    <p style="text-align: justify; margin-bottom: 25px; page-break-inside: avoid;">
        El embarque ha sido preparado en lugares con óptimas condiciones de seguridad y
        protegido de toda intervención ilícita durante su preparación, embalaje, almacenamiento y
        transporte hacia las instalaciones Portuarias y cumple con todos los requisitos exigidos por la ley.
    </p>

    <div style="margin-top: 50px; page-break-inside: avoid;">
        <p style="margin: 0; padding-bottom: 15px;">
            Atentamente,
        </p>

        <div style="display: inline-block;">
            <p style="margin: 0;">${nombreRepresentante}</p>
            <p style="margin: 0;">C.C: ${cedula}</p>
            <p style="margin: 0;">${cargo}</p>
            <p style="margin: 0;">CELULAR: ${celular}</p>
        </div>
    </div>
</div>
`;
    setCartaGenerada(contenidoHTML);
  };


  // Función para imprimir/copiar
  const handlePrint = () => {
    if (!cartaGenerada) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Carta de Responsabilidad</title>');
    printWindow.document.write('<style>body { font-family: Arial, sans-serif; margin: 50px; } div { line-height: 1.4; }</style>'); 
    printWindow.document.write('</head><body>');
    printWindow.document.write(cartaGenerada);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };


  return (
    <div className="row">
      {/* Columna del Formulario */}
      <div className="col-lg-5">
        <form onSubmit={generarCarta}>
            
            {/* 1. SECCIÓN DATOS DE LA EMPRESA Y LOGO */}
            <div className="card shadow-sm p-4 mb-4 border-primary">
                <h4 className="card-title text-primary">Datos de la Empresa Exportadora</h4>
                <p className="text-muted small">Datos que van en el encabezado de la carta.</p>
                
                <div className="mb-3">
                    <label htmlFor="exportador" className="form-label">Nombre de la Empresa (C.I. Banana S.A)</label>
                    <input type="text" className="form-control" id="exportador" name="exportador" value={datosEmpresa.exportador} onChange={handleChangeEmpresa} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="nit" className="form-label">NIT</label>
                    <input type="text" className="form-control" id="nit" name="nit" value={datosEmpresa.nit} onChange={handleChangeEmpresa} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="direccionExportador" className="form-label">Dirección</label>
                    <input type="text" className="form-control" id="direccionExportador" name="direccionExportador" value={datosEmpresa.direccionExportador} onChange={handleChangeEmpresa} required />
                </div>
                <div className="row">
                    <div className="mb-3 col-md-6">
                        <label htmlFor="telefonoExportador" className="form-label">Teléfono</label>
                        <input type="text" className="form-control" id="telefonoExportador" name="telefonoExportador" value={datosEmpresa.telefonoExportador} onChange={handleChangeEmpresa} required />
                    </div>
                    <div className="mb-3 col-md-6">
                        <label htmlFor="ciudadEmision" className="form-label">Ciudad de Emisión (Fecha)</label>
                        <input type="text" className="form-control" id="ciudadEmision" name="ciudadEmision" value={datosEmpresa.ciudadEmision} onChange={handleChangeEmpresa} required />
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="logoUrl" className="form-label">URL del Logo de la Empresa</label>
                    <input type="url" className="form-control" id="logoUrl" name="logoUrl" value={logoUrl} onChange={handleChangeLogo} placeholder="https://..." required />
                </div>
            </div>

            {/* 2. SECCIÓN DESTINATARIO */}
            <div className="card shadow-sm p-4 mb-4 border-danger">
                <h4 className="card-title text-danger">Datos del Destinatario</h4>
                
                <div className="mb-3">
                    <label htmlFor="destinatarioPrincipal" className="form-label">Destinatario Principal (Señores:)</label>
                    <input type="text" className="form-control" id="destinatarioPrincipal" name="destinatarioPrincipal" value={datosDestinatario.destinatarioPrincipal} onChange={handleChangeDestinatario} required />
                </div>
                <div className="mb-3">
                    <label htmlFor="departamento" className="form-label">Departamento/Compañía</label>
                    <input type="text" className="form-control" id="departamento" name="departamento" value={datosDestinatario.departamento} onChange={handleChangeDestinatario} required />
                </div>
            </div>


            {/* 3. SECCIÓN DATOS DEL FIRMANTE */}
            <div className="card shadow-sm p-4 mb-4">
                <h4 className="card-title text-success">Datos del Firmante</h4>
                <div className="mb-3">
                    <label htmlFor="nombreRepresentante" className="form-label">Nombre del Representante</label>
                    <input type="text" className="form-control" id="nombreRepresentante" name="nombreRepresentante" value={datosSignatory.nombreRepresentante} onChange={handleChangeSignatory} required />
                </div>
                <div className="row">
                    <div className="mb-3 col-md-6">
                        <label htmlFor="cedula" className="form-label">Cédula</label>
                        <input type="text" className="form-control" id="cedula" name="cedula" value={datosSignatory.cedula} onChange={handleChangeSignatory} required />
                    </div>
                    <div className="mb-3 col-md-6">
                        <label htmlFor="cargo" className="form-label">Cargo</label>
                        <input type="text" className="form-control" id="cargo" name="cargo" value={datosSignatory.cargo} onChange={handleChangeSignatory} required />
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="celular" className="form-label">Celular (Firma)</label>
                    <input type="text" className="form-control" id="celular" name="celular" value={datosSignatory.celular} onChange={handleChangeSignatory} />
                </div>
            </div>


            {/* 4. SECCIÓN DATOS DEL EMBARQUE */}
            <div className="card shadow-sm p-4">
                <h4 className="card-title text-secondary">Datos del Embarque</h4>
                
                <div className="mb-3">
                    <label htmlFor="agenciaAduanas" className="form-label">Nombre Agencia de Aduanas</label>
                    <input type="text" className="form-control" id="agenciaAduanas" name="agenciaAduanas" value={datosEmbarque.agenciaAduanas} onChange={handleChangeEmbarque} required />
                </div>
                
                <div className="mb-3">
                    <label htmlFor="ciudadOrigenMercancia" className="form-label">Ciudad de Origen de la Mercancía (ZONA BANANERA)</label>
                    <input type="text" className="form-control" id="ciudadOrigenMercancia" name="ciudadOrigenMercancia" value={datosEmbarque.ciudadOrigenMercancia} onChange={handleChangeEmbarque} required />
                </div>

                <div className="d-grid">
                    <button type="submit" className="btn btn-primary mt-3">
                        Generar Carta
                    </button>
                </div>
            </div>
          </form>
      </div>

      {/* Columna de la Carta Generada (Usando HTML) */}
      <div className="col-lg-7 mt-4 mt-lg-0">
        <div className="card shadow-sm p-4 bg-light h-100">
          <h4 className="card-title">Vista Previa de la Carta Antinarcóticos</h4>
          <hr/>
          {cartaGenerada ? (
            <>
              {/* Usamos dangerouslySetInnerHTML para renderizar el HTML generado */}
              <div 
                  style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', border: '1px solid #ccc' }}
                  dangerouslySetInnerHTML={{ __html: cartaGenerada }} 
              />
              <div className="mt-3 d-flex justify-content-end">
                <button 
                    onClick={handlePrint} 
                    className="btn btn-success me-2"
                >
                    <i className="bi bi-printer"></i> Imprimir / PDF
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-muted py-5">
              <p>Complete los datos del firmante y del embarque, luego haga clic en <b>Generar Carta</b> para ver la vista previa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartaAntinarcoticosForm;