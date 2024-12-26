import React, { useState } from 'react';
import ListadoBuques from '@components/seguridad/Embarques/ListadoBuques';
import ListadoNavieras from '@components/seguridad/Embarques/ListadoNavieras';
import ListadoEmbarques from '@components/seguridad/Embarques/ListadoEmbarques'; // Asegúrate de que este sea el componente correcto
import { Button, ButtonGroup } from 'react-bootstrap';
import ListadoDestinos from '@components/seguridad/Embarques/ListadoDestinos';

const Embarques = () => {
  const [activeTab, setActiveTab] = useState('Embarques');

  const renderContent = () => {
    switch (activeTab) {
      case 'Embarques':
        return <ListadoEmbarques />;
      case 'Navieras':
        return <ListadoNavieras />;
      case 'Buques':
        return <ListadoBuques />;
      case 'Destinos':
        return <ListadoDestinos />;
      default:
        return <ListadoEmbarques />;
    }
  };

  return (
    <>
      <div className='d-flex justify-content-between align-items-center'>
        <h2 className="mb-2">{activeTab}</h2>
        <ButtonGroup>
          <Button
            className="btn btn-sm"
            variant={activeTab === 'Embarques' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('Embarques')}
          >
            Embarques
          </Button>
          <Button
            className="btn btn-sm"
            variant={activeTab === 'Navieras' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('Navieras')}
          >
            Navieras
          </Button>
          <Button
            className="btn btn-sm"
            variant={activeTab === 'Buques' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('Buques')}
          >
            Buques
          </Button>
          <Button
            className="btn btn-sm"
            variant={activeTab === 'Destinos' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('Destinos')}
          >
            Destinos
          </Button>
        </ButtonGroup>
      </div>

      <div className="line"></div>
      {/* Renderizar contenido basado en la pestaña activa */}
      {renderContent()}
    </>
  );
};

export default Embarques;
