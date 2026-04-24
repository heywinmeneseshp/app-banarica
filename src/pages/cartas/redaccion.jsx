import Layout from '@layout/ThirdLayout';
import CartaAntinarcoticosForm from '@components/documentos/CartaAntinarcoticosForm';

const RedaccionCartasPage = () => {
  return (
    <Layout>
      <div className="container-fluid px-0 mt-3 mb-5">
        <h1 className="mb-4">Generar Carta de Responsabilidad Antinarcoticos</h1>
        <p className="lead">
          Ajusta la redaccion base de la carta y guarda la configuracion para reutilizarla en los envios.
        </p>
        <hr />
        <CartaAntinarcoticosForm />
      </div>
    </Layout>
  );
};

export default RedaccionCartasPage;
