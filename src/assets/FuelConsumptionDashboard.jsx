/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useState } from 'react';
import Formularios from '@components/shared/Formularios/Formularios';
//SERVICES
import { consultarConsumo, liquidarConsumoRutas } from '@services/api/record_consumo';
import useAlert from '@hooks/useAlert';
import Alertas from '@assets/Alertas';



const Card = ({ setChange, km_recorridos, record_consumo_id, title, initialStock, refueling, date, setAlert }) => {

  const [tanquar, setTanquear] = useState(false);


  useEffect(() => {
  }, []);

  const liquidar = () => {
    if (km_recorridos == 0 || km_recorridos == null) {
      return alert("Por favor, ingrese una cantidad válida de kilómetros recorridos.");
    }
    openLiquidar(true);
  };

  const openLiquidar = (bool) => {
    setTanquear(bool);
    setChange(bool);
  };

  return (
    <>
      {tanquar && <Formularios
        crear={liquidarConsumoRutas}
        actualizar={liquidarConsumoRutas}
        setOpen={openLiquidar}
        element={false}
        setAlert={setAlert}
        encabezados={{
          "Record id": "record_consumo_id",
          "Tanqueo": "tanqueo",
          "Stock real": "stock_real",
        }}
        onlyRead={["record_consumo_id"]} /*Solo lectura es este el valor predeteminado*/
        valorPredeterminado={record_consumo_id} /*Colocar el valorPredeterminado como defecto*/
      />}
      <div className="col-md-3 mb-4">
        <div className="card border-0 rounded-3 shadow">
          <div className="card-header bg-success text-white border-0 rounded-top d-flex justify-content-between align-items-center text-center">
            <span>
              <b>{title}</b> </span>
            <span onClick={() => liquidar()}
              style={{ width: '20px', height: '20px', }}
              className="rounded-circle border text-black border-warning bg-warning d-flex justify-content-center align-items-center">
              <b>+</b>
            </span>
          </div>
          <div className="card-body text-center text-sm">
            <strong>
              <p className="card-text"> Stock Inicial: {initialStock} gal</p>
            </strong>
            <strong>
              <p className="card-text text-success">Tanqueo: {refueling} gal</p>
            </strong>
            <strong>
              <p className="card-text text-danger">Recorrido: {km_recorridos || 0} Kms</p>
            </strong>
            <div className='mb-3 mt-1'>

            </div>
            <p className="card-text">Fecha: {date}</p>
          </div>
        </div>
      </div >
    </>
  );
};

const FuelConsumptionDashboard = ({ handleChange }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [change, setChange] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        let vehiculosList = await consultarConsumo();

        console.log(vehiculosList);

        vehiculosList.sort((a, b) => {
          // Convertir las placas a minúsculas para asegurar una comparación insensible a mayúsculas
          const placaA = a.placa.toLowerCase();
          const placaB = b.placa.toLowerCase();
        
          // Comparar las placas
          if (placaA !== placaB) {
            return placaA.localeCompare(placaB);
          }
        
          // Si las placas son iguales, ordenar por categoría
          const categoriaA = a.programacion[0].vehiculo.categoria_id.toLowerCase();
          const categoriaB = b.programacion[0].vehiculo.categoria_id.toLowerCase(); 
        
          // Comparar las categorías
          if (categoriaA !== categoriaB) {
            return categoriaA.localeCompare(categoriaB);
          }
        
          // Si las categorías son iguales, convertir las fechas a objetos de fecha y ordenar por fecha
          const fechaA = new Date(a.fecha);
          const fechaB = new Date(b.fecha);
        
          return fechaA - fechaB;
        });
        
        


        setVehiculos(vehiculosList);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [change]);



  return (
    <span>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <div className="container" style={{ minWidth: '90vw', minHeight: '100vh' }}>
        <h1 className="text-center mb-4">Pendientes por liquidar</h1>
        <div className="row align-items-center justify-content-center">
          {vehiculos.map((item, index) => {
            return (
              <Card
                key={index}
                vehiculo_id={item.vehiculo_id}
                title={item.placa}
                refueling={item.tanqueo || 0}
                initialStock={item.programacion[0].vehiculo.combustible}
                record_consumo_id={item.record_consumo[0].id}
                km_recorridos={item.record_consumo[0].km_recorridos}
                date={item.fecha}
                setChange={setChange}
                change={change}
                setAlert={setAlert}
                vehiculos={vehiculos}
                handleChange={handleChange}
              />
            );
          }
          )}
        </div>
      </div>
    </span>
  );
};

export default FuelConsumptionDashboard;
