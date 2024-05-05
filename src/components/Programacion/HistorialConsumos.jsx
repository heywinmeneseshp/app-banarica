// components/TablaViajes.tsx

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import menos from '@public/images/menos.png';
import * as XLSX from 'xlsx';

import { listarConductores } from '@services/api/conductores';
import { actualizarRecord_consumo, eliminarRecord_consumo, paginarRecord_consumo } from '@services/api/record_consumo';
import useAlert from '@hooks/useAlert';

import editar from '@public/images/editar.png';
import guardar from '@public/images/guardar.png';
import Formularios from '@components/shared/Formularios/Formularios';
import { actualizarVehiculo } from '@services/api/vehiculos';
import { Button } from 'react-bootstrap';

export default function Programador() {


      
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(100);
    const [itemList, setItemsList] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [open, setOpen] = useState(false);
    const [boolEdit, setBoolEdit] = useState([]);
    const [boolKm, setBoolKm] = useState([]);
    const [openConsumo, setOpenConsumo] = useState(false);
    const [element, setElement] = useState({});
    const { alert, setAlert, toogleAlert } = useAlert();
const tablaRef = useRef();
    const formRef = useRef();
    const formEdit = useRef();
    


    useEffect(() => {
        listar();
    }, [pagination, alert, boolEdit, boolKm],);

    const listar = async () => {
        const formData = new FormData(formRef.current);
        const newConductores = await listarConductores();
        setConductores(newConductores);
        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha")
        };

        let fechaFin = formData.get("fecha_fin");
        if (fechaFin) body.fechaFin = fechaFin;

        const res = await paginarRecord_consumo(pagination, limit, body);
        setItemsList(res.data);
        if (boolEdit.length == 0) {
            let arrayBool = new Array(res.data.length).fill(false);
            setBoolKm(arrayBool);
            setBoolEdit(arrayBool);
        }

        setTotal(res.total);
        setLimit(100);
    };

    const editarConsumo = async (item) => {
        setElement(item);
        setOpenConsumo(true);
    };

    const editarKm = async (index, id) => {
        const formData = new FormData(formEdit.current);
        const valorInput = formData.get(`${id}-km`);
        if (valorInput != null) {
            await actualizarRecord_consumo(id, { km_recorridos: valorInput });
        };
        setBoolKm(prevState => {
            const newArray = [...prevState];
            newArray[index] = !newArray[index];
            return newArray;
        });
    };

    const actualizar = async (id, item) => {
        const consumo = (item.gal_por_km * item.km_recorridos);
        const stock = parseFloat(item.stock_inicial) + parseFloat(item.tanqueo);
        const stockFinal = stock - consumo;
        let element = {
            "stock_inicial": item.stock_inicial,
            "gal_por_km": item.gal_por_km,
            "km_recorridos": item.km_recorridos,
            "tanqueo": item.tanqueo,
            "stock_final": stockFinal,
            "stock_real": item.stock_real,
        };


        const { data } = await actualizarRecord_consumo(id, element);
        const newElement = data.nextItem;

        if (newElement.stock_final == null) {
            await actualizarVehiculo(newElement.vehiculo_id, { "combustible": item.stock_real });
        } else {

            const newStockFinal = (parseFloat(item.stock_real) + parseFloat(newElement.tanqueo)) - (newElement.gal_por_km * newElement.km_recorridos);
            await actualizarRecord_consumo(newElement.id, {
                "stock_inicial": item.stock_real,
                "stock_final": newStockFinal,
            });
        }
    };

    const eliminar = async (id) => {
        await eliminarRecord_consumo(id);
        setAlert({
            active: true,
            mensaje: "El item ha sido eliminado",
            color: "success",
            autoClose: true
        });
    };

    const descargarExcel = async () => {
        const formData = new FormData(formRef.current);

        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha")
        };

        let fechaFin = formData.get("fecha_fin");
        if (fechaFin) body.fechaFin = fechaFin;

        const {data} = await paginarRecord_consumo(null, null, body);
        console.log(data);

        const newData = data.map( (item) => {
            const stockInicial = parseFloat(item?.stock_inicial || 0).toFixed(2);
            const stockReal = parseFloat(item?.stock_real || 0).toFixed(2);
            const stockFinal = parseFloat(item?.stock_final || 0).toFixed(2);
            const tanqueo = parseFloat(item?.tanqueo || 0).toFixed(2);
            const recorridos = parseFloat(item?.km_recorridos || 0).toFixed(2);
            const gal_por_km = parseFloat(item?.gal_por_km || 0).toFixed(4);
            const consumo_real = (parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)).toFixed(2);
            const gal_por_km_real = ((parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)) / recorridos).toFixed(4);
            const consumo_teorico = (recorridos * gal_por_km).toFixed(2);
            const diferencia = (stockReal - stockFinal).toFixed(2);
            return {
                "Fecha": { v: item.fecha, s: { fill: { fgColor: { rgb: "FFFF00" } } } },
                "Vehículo": item?.vehiculo?.placa,
                "Conductor": item?.conductore?.conductor,
                "Stock incial": stockInicial.replace(".", ","),
                "Recorrido": recorridos.replace(".", ","),
                "Gal por km teórico": gal_por_km.replace(".", ","),
                "Gal por km real": stockReal !=0  ? gal_por_km_real.replace(".", ",") : null,
                "Consumo teórico": stockReal !=0 ? consumo_teorico.replace(".", ",") : null,
                "Consumo real": stockReal !=0 ? consumo_real.replace(".", ",") : null,
                "Tanqueo": stockReal !=0 ? tanqueo.replace(".", ",") : null,
                "Stock final": stockReal !=0 ? (stockFinal).replace(".", ",") : null,
                "Stock real": stockReal !=0 ? (stockReal).replace(".", ",") : null,
                "Diferencia": diferencia ? diferencia.replace(".", ",") : null,
            };
        });

        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData);
        XLSX.utils.book_append_sheet(book, sheet, "Consumos");
        XLSX.writeFile(book, `Historial de consumos.xlsx`);
    };

    return (
        <>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <form ref={formRef} style={{ minWidth: '90vw' }} method="POST" className="container" action="/crear-conductor">

                <div className="row col-md-12 row">
                    <div className="mb-2 col-md-2 col-lg-2">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                            type="text"
                            id="semana"
                            name="semana"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
                        <input
                            type="date"
                            id="fecha"
                            name="fecha"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha final</label>
                        <input
                            type="date"
                            id="fecha_fin"
                            name="fecha_fin"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
                        <input
                            type="text"
                            id="vehiculo"
                            name="vehiculo"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="articulo">Conductor</label>
                        <div>
                            <input
                                id='conductor'
                                name='conductor'
                                type="text"
                                list="conductorItems"
                                className="form-control form-control-sm"
                                onChange={() => listar()}
                            />
                            <datalist
                                id="conductorItems"
                                name='conductorItems'
                            >
                                <option value={""} />
                                {conductores.map((item, index) => (
                                    <option key={index} value={item.conductor} />
                                ))}
                            </datalist>

                        </div>
                    </div>


                    <div className="mb-2 col-md-2">
                                         
             

                            <Button type="button" onClick={() => descargarExcel()} className="w-100 mt-4" variant="success" size="sm">
                                Descargar Excel
                            </Button>

                    </div>
                </div>



            </form >


            <form ref={formEdit} className={style.texto}>
                <table ref={tablaRef} className="table table-striped table-bordered table-sm mt-4">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th className='col d-none d-lg-block'>Sem</th>
                            <th>Vehiculo</th>
                            <th className='col d-none d-lg-block'>Conductor</th>
                            <th className='text-center'>Stock Inicial</th>
                            <th className='text-center'>Recorrido</th>
                            <th className='text-center'>Gal por Km</th>
                            <th className='bg-danger text-white text-center'>Consumo</th>
                            <th className='bg-success text-white text-center'>Tanqueo</th>
                            <th className='text-center'>Stock Final</th>
                            <th className='bg-info  text-center'>Stock Real</th>
                            <th className='bg-warning text-black text-center'>Diferencia</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => {
                            const stock_real = item?.stock_real || 0;
                            const stock_final = item?.stock_final || 0;

                            const diferencia = (stock_real - stock_final).toFixed(2);
                            const bgColor = diferencia > 2 ? "bg" : diferencia < -2 ? "bg" : "table";
                            const text = bgColor == "bg" ? "text-white" : "text-black";
                            let colorDif = diferencia > 0 ? `${bgColor}-success ${text}` : (diferencia == 0 ? "" : `${bgColor}-danger ${text}`);

                            return (<tr key={index}>
                                <td>{item?.fecha}</td>
                                <td className='col d-none d-lg-block'>{item?.semana}</td>
                                <td>{item?.vehiculo?.placa}</td>
                                <td className='col d-none d-lg-block'>{item?.conductore?.conductor}</td>
                                <td className=' text-center'>{item?.stock_inicial}</td>
                                <td className='text-center'>
                                    <div className='d-flex justify-content-center align-items-start'>
                                        <div className='col-9'>
                                            {!boolKm[index] && <span>{`${item?.km_recorridos || 0} Km`}</span>}
                                            {boolKm[index] && <input
                                                id={`${item.id}-km`}
                                                name={`${item.id}-km`}
                                                type='number'
                                                style={{
                                                    width: "40px",
                                                    height: "20px",
                                                    borderColor: "rgba(0, 0, 0, 0.175)",
                                                    borderRadius: " 0.25rem",
                                                }}
                                            />}

                                        </div>
                                        <div className='col-3' style={{ alignSelf: 'center' }}>
                                            {!item.liquidado && <Image
                                                onClick={() => editarKm(index, item.id)}
                                                style={{ cursor: 'pointer' }}
                                                src={!boolKm[index] ? editar : guardar} height={15} width={15} alt="editar" />
                                            }
                                        </div>
                                    </div>
                                </td>
                                <td className='text-center'>{`${(item?.gal_por_km || 0).toFixed(3)}`}</td>
                                <td className='table-danger text-center'>{(stock_final - item?.stock_inicial - item?.tanqueo).toFixed(2)}</td>
                                <td className='table-success text-center'>{(item?.tanqueo || 0).toFixed(2)}</td>
                                <td className=' text-center'>{stock_final}</td>
                                <td className='table-info text-center'>
                                    <div className='d-flex justify-content-center align-items-start'>
                                        <div className='col-9'>
                                            {!boolEdit[index] && <span>{stock_real}</span>}
                                            {boolEdit[index] && <input
                                                id={`${item.id}-consumo`}
                                                name={`${item.id}-consumo`}
                                                style={{
                                                    width: "40px",
                                                    height: "20px",
                                                    borderColor: "rgba(0, 0, 0, 0.175)",
                                                    borderRadius: " 0.375rem",
                                                }}
                                            />}
                                        </div>
                                        <div className='col-3' style={{ alignSelf: 'center' }}>
                                            {item.liquidado && <Image
                                                onClick={() => editarConsumo(item)}
                                                style={{ cursor: 'pointer' }}
                                                src={editar} height={15} width={15} alt="editar" />
                                            }
                                        </div>
                                    </div>
                                </td>
                                <td className={`${colorDif} text-center`}>{diferencia}</td>
                                <th className='text-center align-middle'>
                                    {(item?.km_recorridos || 0) == 0 && <Image style={{ cursor: 'pointer' }} onClick={() => eliminar(item.id)} width="20" height="20" src={menos} alt="menos" />
                                    }
                                </th>
                            </tr>);
                        })}

                    </tbody>
                </table>


                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </form>
            {open && <FormulariosProgramacion setOpen={setOpen} setAlert={setAlert} />}
            {
                openConsumo && <Formularios
                    actualizar={actualizar}
                    setOpen={setOpenConsumo}
                    element={element}
                    setAlert={setAlert}
                    encabezados={{
                        "Id": "id",
                        "Stock inicial": "stock_inicial",
                        "Gal por km": "gal_por_km",
                        "Kms recorridos": "km_recorridos",
                        "Tanqueo": "tanqueo",
                        "Stock real": "stock_real",
                    }}
                />
            }
        </>
    );
}
