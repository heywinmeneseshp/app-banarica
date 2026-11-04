import React, { useEffect, useState } from 'react';

// Navegacion con flechas arriba/abajo, Enter para elegir y Escape para cerrar.
// Se usa asi: const nav = useNavegacionSugerencias(lista, visible, elegir);
// <input onKeyDown={nav.onKeyDown} /> y en cada <li>: className={nav.claseItem(i)} data-sug-activa={nav.activo === i}
export function useNavegacionSugerencias(lista, visible, elegir) {
  const [activo, setActivo] = useState(-1);

  useEffect(() => { setActivo(-1); }, [lista, visible]);
  useEffect(() => {
    if (activo < 0) return;
    document.querySelector('[data-sug-activa="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  function onKeyDown(e) {
    if (!visible || !lista.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((a) => (a + 1) % lista.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => (a <= 0 ? lista.length - 1 : a - 1));
    } else if (e.key === 'Enter' && activo >= 0 && lista[activo]) {
      e.preventDefault();
      elegir(lista[activo]);
    }
  }

  return { activo, onKeyDown, claseItem: (i) => `list-group-item list-group-item-action py-1 px-2${activo === i ? ' active' : ''}` };
}

// Lista de sugerencias con posicion fija para que no la recorte el scroll de la tabla.
export default function SugerenciasDropdown({ anchorRef, show, children }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!show || !anchorRef?.current) { setPos(null); return undefined; }

    function recalcular() {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const altoMax = 220;
      const abajo = window.innerHeight - r.bottom;
      const arriba = r.top;
      const haciaArriba = abajo < altoMax && arriba > abajo;
      const disponible = haciaArriba ? Math.min(arriba - 4, altoMax) : Math.min(abajo - 4, altoMax);
      setPos({
        left: r.left,
        minWidth: Math.max(r.width, 260),
        maxHeight: disponible,
        ...(haciaArriba ? { bottom: window.innerHeight - r.top + 2 } : { top: r.bottom + 2 }),
      });
    }

    recalcular();
    window.addEventListener('scroll', recalcular, true);
    window.addEventListener('resize', recalcular);
    return () => {
      window.removeEventListener('scroll', recalcular, true);
      window.removeEventListener('resize', recalcular);
    };
  }, [show, anchorRef]);

  if (!show || !pos) return null;
  return (
    <ul
      className="list-group shadow border rounded bg-white"
      style={{ position: 'fixed', zIndex: 2000, overflowY: 'auto', margin: 0, padding: 0, ...pos }}
    >
      {children}
    </ul>
  );
}
