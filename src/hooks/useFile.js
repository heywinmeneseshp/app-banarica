


export default function useFile() {

    const ordenarExcelSerial = (data, cons_almacen, cons_producto) => {
        if (cons_producto == 0) {
            data.shift();
            const newList = data.map(item => {
                const data = {
                    cons_producto: item[0],
                    serial: item[1],
                    bag_pack: item[2] ? item[2] : "null",
                    s_pack: item[3] ? item[3] : "null",
                    m_pack: item[4] ? item[4] : "null",
                    l_pack: item[5] ? item[5] : "null",
                    cons_almacen: cons_almacen,
                    available: true
                };
                return data;
            });
            return newList;
        } else {
            data.shift();
            const newList = data.map(item => {
                const data = {
                    cons_producto: cons_producto,
                    serial: item[1],
                    bag_pack: item[2] ? item[2] : "null",
                    s_pack: item[3] ? item[3] : "null",
                    m_pack: item[4] ? item[4] : "null",
                    l_pack: item[5] ? item[5] : "null",
                    cons_almacen: cons_almacen,
                    available: true
                };
                return data;
            });
            return newList;
        }

    };

    return {
        ordenarExcelSerial
    };
}

