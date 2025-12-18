import Layout from '@layout/MainLayout'; 
import CartaAntinarcoticosForm from '@components/documentos/CartaAntinarcoticosForm';

const RedaccionCartasPage = () => {
  return (
    <Layout >
      <div className="container mt-4 mb-5">
        <h1 className="mb-4">🛡️ Generar Carta de Responsabilidad Antinarcóticos</h1>
        <p className="lead">
          Ingrese el Número de Anuncio (SAE) para cargar automáticamente los datos del embarque.
        </p>
        <hr />
        <CartaAntinarcoticosForm />
      </div>
    </Layout>
  );
};

export default RedaccionCartasPage;