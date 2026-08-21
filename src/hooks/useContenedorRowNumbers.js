import { useMemo, useRef } from 'react';

/**
 * Numera las filas de una tabla paginada por CONTENEDOR (no por linea): filas
 * consecutivas del mismo contenedor comparten numero, y el numero sigue
 * subiendo entre paginas (pagina 2 continua donde quedo la 1, no reinicia).
 *
 * Como cada pagina puede tener una cantidad distinta de contenedores unicos,
 * el numero inicial de una pagina depende de cuantos contenedores distintos
 * hubo en las paginas anteriores. Esto se seguen mientras el usuario navega
 * secuencialmente (anterior/siguiente); si salta a una pagina nunca visitada
 * (o cambia de filtro), se usa una estimacion razonable como punto de partida
 * ((pagina - 1) * limit + 1), que es exacta cuando hay ~1 linea por
 * contenedor y aproximada en el peor caso.
 *
 * @param {Array} rows - filas de la pagina actual, en el orden ya mostrado
 *   (deben venir agrupadas por contenedor: mismo contenedor en filas
 *   consecutivas, que es como ya vienen ordenadas estas tablas).
 * @param {(row) => string} getContenedor - saca el codigo de contenedor de una fila.
 * @param {number} pagination - pagina actual (1-based).
 * @param {number} limit - filas por pagina (para la estimacion de fallback).
 * @returns {number[]} un numero por fila, en el mismo orden que `rows`.
 */
export default function useContenedorRowNumbers(rows, getContenedor, pagination, limit) {
  // { [pagina]: numeroInicial }
  const offsetsRef = useRef({ 1: 1 });
  const contenedoresPorPaginaRef = useRef({});

  return useMemo(() => {
    if (pagination === 1) {
      offsetsRef.current = { 1: 1 };
      contenedoresPorPaginaRef.current = {};
    }

    const offsetInicial = offsetsRef.current[pagination]
      ?? (Number(pagination) - 1) * Number(limit || 0) + 1;

    const numeros = [];
    let contadorLocal = 0;
    let contenedorAnterior = null;

    (rows || []).forEach((row) => {
      const contenedor = getContenedor(row);
      if (contenedor !== contenedorAnterior) {
        contadorLocal += 1;
        contenedorAnterior = contenedor;
      }
      numeros.push(offsetInicial + contadorLocal - 1);
    });

    contenedoresPorPaginaRef.current[pagination] = contadorLocal;
    offsetsRef.current[Number(pagination) + 1] = offsetInicial + contadorLocal;

    return numeros;
  }, [rows, getContenedor, pagination, limit]);
}
