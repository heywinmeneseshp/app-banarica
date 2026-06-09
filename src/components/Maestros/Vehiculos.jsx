import { useCallback, useEffect, useMemo, useState } from "react";
import Tablas from "@components/shared/Tablas/Tablas";
import Alertas from "@assets/Alertas";
import useAlert from "@hooks/useAlert";
import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";
import endPoints from "@services/api";
import {
  actualizarVehiculo,
  buscarVehiculo,
  listarVehiculo,
  paginarVehiculo,
  agregarVehiculo
} from "@services/api/vehiculos";
import { listarcategoriaVehiculos } from "@services/api/CategoriaVehiculos";
import { listarConductores } from "@services/api/conductores";
import { listarTransportadoras } from "@services/api/transportadoras";
import { getStoredTransporters, getStoredUser } from "@utils/session";

const CONFIG_MODULE = "Programador_combustible";

export default function Vehiculo() {
  const [categoryV, setCategoryV] = useState([]);
  const [conductoresL, setConductoresL] = useState([]);
  const [transportadoras, setTransportadoras] = useState([]);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const { alert, setAlert, toogleAlert } = useAlert();

  const parseVehiculosSinCombustible = (configRows) => {
    try {
      const [config = {}] = configRows || [];
      const parsed = JSON.parse(config?.detalles || "{}");
      return Array.isArray(parsed?.vehiculosSinCombustible)
        ? parsed.vehiculosSinCombustible.map((item) => String(item))
        : [];
    } catch (error) {
      console.warn("No se pudo leer la configuracion de Programador_combustible:", error);
      return [];
    }
  };

  const cargarConfiguracionProgramador = useCallback(async () => {
    const configProgramador = await encontrarModulo(CONFIG_MODULE);
    return parseVehiculosSinCombustible(configProgramador);
  }, []);

  const guardarConfiguracionProgramador = useCallback(async (nextVehiculosSinCombustible) => {
    await actualizarModulo({
      modulo: CONFIG_MODULE,
      detalles: JSON.stringify({
        vehiculosSinCombustible: nextVehiculosSinCombustible.map((item) => String(item)),
      }),
    });
    setVehiculosSinCombustible(nextVehiculosSinCombustible.map((item) => String(item)));
  }, []);

  const enrichVehiculos = useCallback((listaVehiculos = [], configuracion = vehiculosSinCombustible) => (
    (listaVehiculos || []).map((vehiculo) => ({
      ...vehiculo,
      programador_sin_combustible: configuracion.includes(String(vehiculo?.id || "")),
    }))
  ), [vehiculosSinCombustible]);

  const listarCatalogos = useCallback(async () => {
    const user = getStoredUser();
    const transportadorasAsignadas = getStoredTransporters();
    const [categorias, conductores, transportadorasData, configVehiculosSinCombustible] = await Promise.all([
      listarcategoriaVehiculos(),
      listarConductores(),
      user?.id_rol === "Super administrador" ? listarTransportadoras() : Promise.resolve(transportadorasAsignadas),
      cargarConfiguracionProgramador(),
    ]);

    setCategoryV((categorias || []).map((item) => ({ id: item?.id, nombre: item?.categoria })));
    setConductoresL((conductores || []).map((item) => ({ id: item?.id, nombre: item?.conductor })));
    setTransportadoras((transportadorasData || []).map((item) => ({ id: item?.id, nombre: item?.razon_social || item?.consecutivo })));
    setVehiculosSinCombustible(configVehiculosSinCombustible);
  }, [cargarConfiguracionProgramador]);

  useEffect(() => {
    listarCatalogos();
  }, [listarCatalogos]);

  const syncConfigForVehicle = useCallback(async (vehiculoId, enabled) => {
    const key = String(vehiculoId || "");
    const nextConfig = enabled
      ? [...new Set([...vehiculosSinCombustible, key])]
      : vehiculosSinCombustible.filter((item) => item !== key);

    await guardarConfiguracionProgramador(nextConfig);
  }, [guardarConfiguracionProgramador, vehiculosSinCombustible]);

  const crearVehiculoConConfig = useCallback(async (payload) => {
    const { programador_sin_combustible, ...vehiculoPayload } = payload;
    const response = await agregarVehiculo(vehiculoPayload);
    const createdId = String(response?.data?.id || response?.id || "");

    if (programador_sin_combustible && createdId) {
      await syncConfigForVehicle(createdId, true);
    }

    return response;
  }, [syncConfigForVehicle]);

  const actualizarVehiculoConConfig = useCallback(async (id, changes) => {
    const { programador_sin_combustible, ...vehiculoChanges } = changes;
    await actualizarVehiculo(id, vehiculoChanges);

    if (typeof programador_sin_combustible !== "undefined") {
      await syncConfigForVehicle(id, Boolean(programador_sin_combustible));
    }
  }, [syncConfigForVehicle]);

  const listarVehiculosConConfig = useCallback(async () => {
    const [listaVehiculos, configVehiculos] = await Promise.all([
      listarVehiculo(),
      cargarConfiguracionProgramador(),
    ]);
    return enrichVehiculos(listaVehiculos || [], configVehiculos);
  }, [cargarConfiguracionProgramador, enrichVehiculos]);

  const paginarVehiculosConConfig = useCallback(async (page, limit, item, filters = {}) => {
    const [res, configVehiculos] = await Promise.all([
      paginarVehiculo(page, limit, item, filters.transportadoraId || ''),
      cargarConfiguracionProgramador(),
    ]);

    return {
      ...res,
      data: enrichVehiculos(res?.data || [], configVehiculos),
    };
  }, [cargarConfiguracionProgramador, enrichVehiculos]);

  const toggleProgramadorDesdeTabla = useCallback(async (vehiculo) => {
    try {
      const nextValue = !vehiculo?.programador_sin_combustible;
      await syncConfigForVehicle(vehiculo?.id, nextValue);
      setAlert({
        active: true,
        mensaje: nextValue
          ? `El vehiculo ${vehiculo?.placa || vehiculo?.vehiculo || vehiculo?.id} ya no exigira control de combustible en el programador.`
          : `El vehiculo ${vehiculo?.placa || vehiculo?.vehiculo || vehiculo?.id} volvera a exigir control de combustible en el programador.`,
        color: "success",
        autoClose: true,
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error?.message || "No fue posible actualizar la configuracion del programador.",
        color: "danger",
        autoClose: true,
      });
    }
  }, [setAlert, syncConfigForVehicle]);

  const syncProgramadorConfigFromRows = useCallback(async (rows = []) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return;
    }

    const listaVehiculos = await listarVehiculo();
    const vehiculosByPlaca = new Map(
      (listaVehiculos || []).map((vehiculo) => [String(vehiculo?.placa || "").trim().toUpperCase(), String(vehiculo?.id || "")])
    );

    const nextConfig = new Set(vehiculosSinCombustible.map((item) => String(item)));

    rows.forEach((row) => {
      const placa = String(row?.placa || "").trim().toUpperCase();
      const vehiculoId = vehiculosByPlaca.get(placa);
      if (!vehiculoId || !Object.prototype.hasOwnProperty.call(row || {}, "programador_sin_combustible")) {
        return;
      }

      const rawValue = row.programador_sin_combustible;
      const enabled = [true, 1, "1", "true", "si", "sí", "s", "x", "on"].includes(
        String(rawValue).trim().toLowerCase()
      );

      if (enabled) {
        nextConfig.add(vehiculoId);
      } else {
        nextConfig.delete(vehiculoId);
      }
    });

    await guardarConfiguracionProgramador(Array.from(nextConfig));
  }, [guardarConfiguracionProgramador, vehiculosSinCombustible]);

  const listas = useMemo(() => ({
    Categoria: categoryV,
    Conductor: conductoresL,
    Transportadora: transportadoras,
  }), [categoryV, conductoresL, transportadoras]);

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />
      <Tablas
        titulo={"Vehiculos"}
        actualizar={actualizarVehiculoConConfig}
        buscarItem={buscarVehiculo}
        listar={listarVehiculosConConfig}
        paginar={paginarVehiculosConConfig}
        crear={crearVehiculoConConfig}
        encabezados={{
          ID: "id",
          Vehiculo: "vehiculo",
          Modelo: "modelo",
          Placa: "placa",
          Conductor: "conductor_id",
          Categoria: "categoria_id",
          Transportadora: "transportadoraId",
          Combustible: "combustible",
          "Gal por Km": "gal_por_km",
          "Programador sin combustible": "programador_sin_combustible",
          Editar: "",
          Activar: "activo",
        }}
        listas={listas}
        checkboxFields={["programador_sin_combustible"]}
        switchFields={{
          programador_sin_combustible: {
            onToggle: toggleProgramadorDesdeTabla,
          },
        }}
        tituloCargueMasivo={"Vehiculos"}
        endPointCargueMasivo={endPoints.vehiculos.bulkCreate}
        encabezadosCargueMasivo={{
          vehiculo: null,
          modelo: null,
          placa: null,
          conductor_id: null,
          categoria_id: null,
          transportadoraId: null,
          combustible: null,
          gal_por_km: null,
          programador_sin_combustible: null,
          activo: null,
        }}
        tituloActualizacionMasiva={"Actualizar vehiculos"}
        endPointActualizacionMasiva={endPoints.vehiculos.bulkUpdate}
        encabezadosActualizacionMasiva={{
          placa: null,
          vehiculo: null,
          modelo: null,
          conductor_id: null,
          categoria_id: null,
          transportadoraId: null,
          combustible: null,
          gal_por_km: null,
          programador_sin_combustible: null,
          activo: null,
        }}
        onMassUploadSuccess={async (_, rows) => {
          await syncProgramadorConfigFromRows(rows);
          setAlert({
            active: true,
            mensaje: "Cargue masivo de vehiculos completado correctamente.",
            color: "success",
            autoClose: true,
          });
        }}
        onMassUpdateSuccess={async (_, rows) => {
          await syncProgramadorConfigFromRows(rows);
          setAlert({
            active: true,
            mensaje: "Actualizacion masiva de vehiculos completada correctamente.",
            color: "success",
            autoClose: true,
          });
        }}
        filtrosExtra={[
          {
            name: 'transportadoraId',
            label: 'Transportadora',
            options: transportadoras,
          }
        ]}
      />
    </>
  );
}
