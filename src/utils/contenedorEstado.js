const RETURNED_STATUS = "DEVUELTO_MAL_ESTADO";

const normalizeText = (value) => String(value || "").trim().toUpperCase();

const isContainerReturned = (contenedor) => {
  if (!contenedor) return false;

  return (
    contenedor.habilitado === false ||
    contenedor.devuelto_mal_estado === true ||
    contenedor.en_mal_estado === true ||
    normalizeText(contenedor.estado_operativo) === RETURNED_STATUS ||
    normalizeText(contenedor.estado) === RETURNED_STATUS
  );
};

const getContainerReturnInfo = (contenedor) => {
  if (!isContainerReturned(contenedor)) return null;

  return {
    motivo:
      contenedor.motivo_devolucion_mal_estado ||
      contenedor.observacion_devolucion ||
      contenedor.observaciones_devolucion ||
      "",
    fecha:
      contenedor.fecha_devolucion_mal_estado ||
      contenedor.fecha_devolucion ||
      contenedor.updatedAt ||
      contenedor.createdAt ||
      "",
    origen: contenedor.origen_devolucion_mal_estado || contenedor.origen_devolucion || ""
  };
};

const filterActiveContainerRows = (rows = []) =>
  rows.filter((row) => !isContainerReturned(row?.Contenedor || row?.contenedor || row));

const getUniqueReturnedContainers = (rows = []) => {
  const unique = new Map();

  rows.forEach((row) => {
    const contenedor = row?.Contenedor || row?.contenedor || row;
    if (!isContainerReturned(contenedor)) return;

    const key = contenedor.id || contenedor.contenedor;
    if (!key) return;

    const currentInfo = getContainerReturnInfo(contenedor);
    const previous = unique.get(key);

    if (!previous) {
      unique.set(key, { row, contenedor, info: currentInfo });
      return;
    }

    const previousDate = new Date(previous.info?.fecha || 0).getTime();
    const currentDate = new Date(currentInfo?.fecha || 0).getTime();

    if (currentDate >= previousDate) {
      unique.set(key, { row, contenedor, info: currentInfo });
    }
  });

  return Array.from(unique.values());
};

const formatDateValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${year}-${month}-${day}`;
};

export {
  RETURNED_STATUS,
  isContainerReturned,
  getContainerReturnInfo,
  filterActiveContainerRows,
  getUniqueReturnedContainers,
  formatDateValue
};
