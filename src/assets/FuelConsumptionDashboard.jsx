/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useState } from 'react';
import Formularios from '@components/shared/Formularios/Formularios';
//SERVICES
import { consultarConsumo, liquidarConsumoRutas } from '@services/api/record_consumo';
import useAlert from '@hooks/useAlert';
import Alertas from '@assets/Alertas';
import endPoints from '@services/api';
import { enviarEmail } from '@services/api/email';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';



const Card = ({ vehiculos, setChange, km_recorridos, record_consumo_id, title, initialStock, date, setAlert }) => {

  const [tanquar, setTanquear] = useState(false);


  useEffect(() => {
  }, []);

  const liquidar = () => {
    const vehiculoDate = new Date(date);
    let newDate = null;

    vehiculos.forEach(item => {
      const itemDate = new Date(item.fecha);
      if (item.vehiculo.placa == title && itemDate < vehiculoDate) {
        newDate = itemDate;
      }
    });

    if (!km_recorridos || km_recorridos <= 0) {
      return alert("Por favor, ingrese una cantidad válida de kilómetros recorridos.");
    }

    if (newDate && newDate < vehiculoDate) {
      return alert("Existen fechas más antiguas sin liquidar!");
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
        titulo={`${title} ${date}`}
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
        let vehiculosList = await consultarConsumo({ "activo": 1 });
        vehiculosList.sort((a, b) => {
          // Convertir las fechas a objetos de fecha y ordenar por fecha
          const fechaA = new Date(a.fecha);
          const fechaB = new Date(b.fecha);

          // Comparar las fechas
          if (fechaA < fechaB) {
            return -1;
          }
          if (fechaA > fechaB) {
            return 1;
          }
          // Si las fechas son iguales, ordenar por categoría
          const categoriaA = a?.vehiculo?.categoria_id.toLowerCase();
          const categoriaB = b?.vehiculo?.categoria_id.toLowerCase();

          // Comparar las categorías
          if (categoriaA !== categoriaB) {
            return categoriaA.localeCompare(categoriaB);
          }

          // Si las categorías son iguales, ordenar por placa
          const placaA = a?.vehiculo?.placa.toLowerCase();
          const placaB = b?.vehiculo?.placa.toLowerCase();

          // Comparar las placas
          return placaA.localeCompare(placaB);
        });
        setVehiculos(vehiculosList);

        const oldestDateObject = vehiculosList.reduce((oldest, current) => {
          const oldestDate = new Date(oldest.fecha);
          const currentDate = new Date(current.fecha);
          return currentDate < oldestDate ? current : oldest;
        });

        let semana = oldestDateObject.semana;
        let anho = new Date(oldestDateObject.fecha).getFullYear();
        if (semana == 1) {
          semana = 52;
          anho = anho - 1;
        } else {
          semana = semana - 1;
        }
        let mes = new Date(oldestDateObject.fecha);
        mes = mes.setMonth(mes.getMonth() - 1);
        mes = new Date(mes).getMonth() + 1;

        const res = await encontrarModulo("Reporte");
        const mesReporte = res[0].mes_reporte;
        const semReporte = res[0].sem_reporte;

        if (mesReporte != mes) {
          await actualizarModulo({ modulo: "Reporte", mes_reporte: mes });
          await correoReporte("hmeneses@banarica.com, transmonsatecnology@gmail.com, emonsalve@banarica.com, operaciones@transmonsa.com, tesorero@transmonsa.com, tesoreria@transmonsa.com", `Reporte combustibles mes ${mes} del ${anho}`, endPoints.reporteConsumo.mes(mes, anho));
        };

        if (semReporte != semana) {
          await actualizarModulo({ modulo: "Reporte", sem_reporte: semana });
          await correoReporte("hmeneses@banarica.com, transmonsatecnology@gmail.com, emonsalve@banarica.com, operaciones@transmonsa.com, tesorero@transmonsa.com, tesoreria@transmonsa.com", `Reporte combustibles semana ${semana} del ${anho}`, endPoints.reporteConsumo.semana(semana, anho));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [alert]);

  const correoReporte = async (destinatario, asunto, url) => {
    let cuerpo = `<h3>Reporte de recorrido y consumo</h3>
  <p>
    <b>Observaciones:</b>
  </p>
  <p>
   Para ver el reporte hacer 
   <a href="${url}">
      Clic Aquí
    </a>
 </p>`;
    enviarEmail(destinatario, asunto, cuerpo);
  };

  return (
    <span>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <div className="container">
        <h1 className="text-center mb-4">Pendientes por liquidar</h1>
        <div className="row align-items-center justify-content-center">

          {vehiculos.map((item, index) => {
            return (
              <Card
                key={index}
                vehiculo_id={item?.vehiculo_id}
                title={item?.vehiculo?.placa}
                initialStock={item?.vehiculo?.combustible}
                record_consumo_id={item?.id}
                km_recorridos={item?.km_recorridos}
                date={item?.fecha}
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
