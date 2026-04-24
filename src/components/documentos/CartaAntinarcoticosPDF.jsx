import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 42,
    paddingHorizontal: 42,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.45,
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  companyBlock: {
    width: '72%',
  },
  logo: {
    width: 120,
    height: 54,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  recipients: {
    marginBottom: 12,
  },
  detailTable: {
    marginTop: 4,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '42%',
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    width: '58%',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  signatureTitle: {
    marginBottom: 18,
  },
  signatureBlock: {
    marginTop: 34,
  },
});

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default function CartaAntinarcoticosPDF({ carta }) {
  const { empresa, destinatario, signatory, embarque, fechaEmision, urlLogo } = carta || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{empresa?.exportador}</Text>
            <Text>{empresa?.ciudadEmision}, {fechaEmision}</Text>
          </View>
          {urlLogo ? <Image src={urlLogo} style={styles.logo} alt="" /> : null}
        </View>

        <View style={styles.recipients}>
          <Text>Senores:</Text>
          <Text>{destinatario?.destinatarioPrincipal}</Text>
          <Text>{destinatario?.departamento}</Text>
        </View>

        <Text style={styles.title}>REF: CARTA DE RESPONSABILIDAD</Text>

        <Text style={styles.paragraph}>
          Yo <Text style={styles.bold}>{signatory?.nombreRepresentante}</Text> identificado con Cedula de Ciudadania N°
          {' '}<Text style={styles.bold}>{signatory?.cedula}</Text> expedida en {empresa?.ciudadEmision}, en condicion de representante
          de la empresa <Text style={styles.bold}>{empresa?.exportador}</Text> con Nit <Text style={styles.bold}>{empresa?.nit}</Text>,
          {' '}certifico que el contenido de la presente carga se ajusta a lo declarado en nuestro despacho asi:
        </Text>

        <View style={styles.detailTable}>
          <DetailRow label="NOMBRE DEL EXPORTADOR:" value={empresa?.exportador} />
          <DetailRow label="DIRECCION DEL EXPORTADOR:" value={empresa?.direccionExportador} />
          <DetailRow label="TELEFONO DEL EXPORTADOR:" value={empresa?.telefonoExportador} />
          <DetailRow label="NOMBRE MOTONAVE Y NUMERO DE VIAJE:" value={`${embarque?.motonave || ''} - ${embarque?.viaje || ''}`} />
          <DetailRow label="PUERTO DESTINO:" value={embarque?.puertoDestino} />
          <DetailRow label="DESTINO FINAL DE LA MERCANCIA:" value={embarque?.destinoFinal || embarque?.puertoDestino} />
          <DetailRow label="PORCENTAJE VACIO:" value={embarque?.porcentajeVacio} />
          <DetailRow label="CIUDAD DE ORIGEN DE LA MERCANCIA:" value={embarque?.ciudadOrigenMercancia} />
          <DetailRow label="MERCANCIA Y SU CANTIDAD:" value={embarque?.mercanciaCantidad} />
          <DetailRow label="CANTIDAD CAJAS:" value={embarque?.cantCajas} />
          <DetailRow label="CONTENEDOR Y SELLOS:" value={`${embarque?.cantContenedores || ''} Uds. VER LISTADO ANEXO`} />
          <DetailRow label="PESO NETO:" value={embarque?.pesoNeto} />
          <DetailRow label="PESO BRUTO:" value={embarque?.pesoBruto} />
          <DetailRow label="NOMBRE AGENCIA DE ADUANAS:" value={embarque?.agenciaAduanas} />
          <DetailRow label="NIT AGENCIA DE ADUANAS:" value={embarque?.nitAgenciaAduanas || ' '} />
          <DetailRow label="VUCE:" value={embarque?.vuce || ' '} />
          <DetailRow label="NUMERO ANUNCIO:" value={embarque?.numAnuncio} />
          <DetailRow label="NUMERO BOOKING:" value={embarque?.bl} />
          <DetailRow label="NOMBRE DEL IMPORTADOR:" value={embarque?.nombreImportador} />
          <DetailRow label="DIRECCION DEL IMPORTADOR:" value={embarque?.direccionImportador || ' '} />
          <DetailRow label="TELEFONO DEL IMPORTADOR:" value={embarque?.telefonoImportador || ' '} />
        </View>

        <Text style={styles.paragraph}>
          Nos hacemos responsables por el contenido de esta carga ante las autoridades colombianas,
          extranjeras y ante el transportador en caso de que se encuentren sustancias o elementos
          narcoticos, explosivos ilicitos o prohibidos, armas o partes de ellas, municiones,
          material de guerra o sus partes u otros elementos que no cumplan con las obligaciones
          legales establecidas para este tipo de carga.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.paragraph}>
          Esta responsabilidad aplica siempre que se conserven los empaques, caracteristicas y
          sellos originales con los que la carga fue entregada al transportador.
        </Text>

        <Text style={styles.paragraph}>
          El embarque ha sido preparado en lugares con optimas condiciones de seguridad y protegido
          de toda intervencion ilicita durante su preparacion, embalaje, almacenamiento y transporte
          hacia las instalaciones portuarias, cumpliendo con los requisitos exigidos por la ley.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureTitle}>Atentamente,</Text>
          <Text>{signatory?.nombreRepresentante}</Text>
          <Text>C.C: {signatory?.cedula}</Text>
          <Text>{signatory?.cargo}</Text>
          <Text>CELULAR: {signatory?.celular}</Text>
        </View>
      </Page>
    </Document>
  );
}
