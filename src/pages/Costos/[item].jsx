import React from "react";
import { useRouter } from "next/router";

import FacturasView from "@containers/costos/FacturasView";

export default function CostosLogisticos() {
    const { query } = useRouter();

    return (
        <div>
            {query.item === "facturas" && <FacturasView />}
        </div>
    );
}
