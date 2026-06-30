import { useCallback, useState } from "react";
import { Button } from "react-bootstrap";
import Tablas from "@components/shared/Tablas/Tablas";
import Alertas from "@components/shared/Alertas";
import useAlert from "@hooks/useAlert";
import { listarAlmacenes } from "@services/api/almacenes";
import { actualizarUbicacion, buscarUbicacion, listarUbicaciones, paginarUbicaciones, agregarUbicacion } from '@services/api/ubicaciones';

const normalizeValue = (value) => String(value || "").trim().toLowerCase();

export default function Ubicaciones() {
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { alert, setAlert, toogleAlert } = useAlert();

  const sincronizarDesdeAlmacenes = useCallback(async () => {
    try {
      setSyncing(true);

      const [almacenes, ubicaciones] = await Promise.all([
        listarAlmacenes(),
        listarUbicaciones(),
      ]);

      const existingKeys = new Set(
        (ubicaciones || []).flatMap((item) => ([
          normalizeValue(item?.cod),
          normalizeValue(item?.ubicacion),
        ])).filter(Boolean)
      );

      const candidates = (almacenes || []).filter((item) => {
        const cod = normalizeValue(item?.consecutivo);
        const nombre = normalizeValue(item?.nombre);

        if (!cod && !nombre) {
          return false;
        }

        return !existingKeys.has(cod) && !existingKeys.has(nombre);
      });

      if (!candidates.length) {
        setAlert({
          active: true,
          mensaje: "No hay almacenes nuevos para crear como ubicaciones.",
          color: "warning",
          autoClose: true,
        });
        return;
      }

      for (const almacen of candidates) {
        await agregarUbicacion({
          cod: almacen?.consecutivo || "",
          ubicacion: almacen?.nombre || almacen?.consecutivo || "",
          detalle: "Generado desde almacenes",
          activo: true,
        });
      }

      setAlert({
        active: true,
        mensaje: `Se crearon ${candidates.length} ubicacion(es) desde almacenes.`,
        color: "success",
        autoClose: true,
      });
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || "No fue posible crear ubicaciones desde almacenes.",
        color: "danger",
        autoClose: true,
      });
    } finally {
      setSyncing(false);
    }
  }, [setAlert]);

  return (
    <>
      <Alertas alert={alert} handleClose={toogleAlert} />

      <div className="d-flex justify-content-end mb-2">
        <Button
          type="button"
          variant="outline-primary"
          size="sm"
          onClick={sincronizarDesdeAlmacenes}
          disabled={syncing}
        >
          {syncing ? "Creando ubicaciones..." : "Crear desde almacenes"}
        </Button>
      </div>

      <Tablas
        key={reloadKey}
        titulo={"Ubicaciones"}
        actualizar={actualizarUbicacion}
        buscarItem={buscarUbicacion}
        listar={listarUbicaciones}
        paginar={paginarUbicaciones}
        crear={agregarUbicacion}
        encabezados={{
          "ID": "id",
          "Cod": "cod",
          "Ubicacion": "ubicacion",
          "Detalle": "detalle",
          "Editar": "",
          "Activar": "activo"
        }}
      />
    </>
  );
}
