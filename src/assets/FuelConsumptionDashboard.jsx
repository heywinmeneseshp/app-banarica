/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useState } from 'react';
import Formularios from '@components/shared/Formularios/Formularios';
//SERVICES
import { consultarConsumo, liquidarConsumoRutas } from '@services/api/record_consumo';
import { agregarTanqueo, actualizarTanqueo } from '@services/api/tanqueo';
import useAlert from '@hooks/useAlert';
import Alertas from '@assets/Alertas';



const Card = ({ setChange, change, vehiculos, record_consumo_id,  title, initialStock, refueling,  date, setAlert }) => {

  const [tanquar, setTanquear] = useState(false);


  useEffect(() => {
  }, []);

  const liquidar = async () => {

    const filteredVehicles = vehiculos
      .filter(item => item.placa === title && new Date(item.fecha) < new Date(date));
    if (filteredVehicles.length > 0) {
      return alert("Aún hay pendientes de liquidación de días anteriores.");
    }
    let stockReal = prompt(`Por favor, introduce la cantidad en galones del combustible existente en el vehículo ${title}:`, "0");
    if (stockReal === null) {
      alert("Operación cancelada por el usuario.");
      return;
    }

    stockReal = parseFloat(stockReal);
    if (isNaN(stockReal)) {
      alert("Debe introducir un valor numérico válido.");
      return;
    }


    let kmRecorrido = prompt(`Por favor, introduce la cantidad km recorridos en el vehículo ${title}:`, "0");
    if (kmRecorrido === null) {
      alert("Operación cancelada por el usuario.");
      return;
    }

    kmRecorrido = parseFloat(kmRecorrido);
    if (isNaN(kmRecorrido)) {
      alert("Debe introducir un valor numérico válido.");
      return;
    }

    try {
      await liquidarConsumoRutas(record_consumo_id, stockReal, kmRecorrido);
      setChange(!change);
    } catch (error) {
      console.error("Error al liquidar consumo de rutas:", error);
    }
  };

  const tanquear = async (bool) => {
    setTanquear(bool);
    setChange(!change);
  };

  return (
    <>
      {tanquar && <Formularios
        crear={agregarTanqueo}
        actualizar={actualizarTanqueo}
        setOpen={tanquear}
        element={false}
        setAlert={setAlert}
        encabezados={{
          "Record id": "record_consumo_id",
          "Fecha": "fecha",
          "No. factura": "factura",
          "Galones": "tanqueo",
          "Costo total": "costo",
        }}
        onlyRead={["record_consumo_id"]} /*Solo lectura es este el valor predeteminado*/
        valorPredeterminado={record_consumo_id} /*Colocar el valorPredeterminado como defecto*/
      />}
      <div className="col-md-3 mb-4">
        <div className="card border-0 rounded-3 shadow">
          <div className="card-header bg-success text-white border-0 rounded-top d-flex justify-content-between align-items-center text-center">
            <span onClick={() => tanquear(true)} style={{
              width: '20px',
              height: '20px',
            }} className="rounded-circle border text-black border-white bg-white d-flex justify-content-center align-items-center"><b>+</b>
            </span>
            <span>
              <b>{title}</b> </span>
            <span onClick={() => liquidar()} style={{
              width: '20px',
              height: '20px',
            }} className="rounded-circle border text-black border-warning bg-warning d-flex justify-content-center align-items-center"><b>+</b>
            </span>
          </div>
          <div className="card-body text-center text-sm">
            <strong>
              <p className="card-text"> Stock Inicial: {initialStock} gal</p>
            </strong>
            <strong>
              <p className="card-text text-success">Tanqueo: {refueling} gal</p>
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

const FuelConsumptionDashboard = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [change, setChange] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  useEffect(() => {
    async function fetchData() {
      try {
        const vehiculosList = await consultarConsumo();
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
                date={item.fecha}
                setChange={setChange}
                change={change}
                setAlert={setAlert}
                vehiculos={vehiculos}
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
