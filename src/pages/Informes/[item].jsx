import React from "react";
import { useRouter } from "next/router";
import InfoTemperatura from "@containers/informes/InfoTemperatura";

export default function Informes() {
    const router = useRouter();
    return (
        <div>
            {router?.query.item == "Temperatura" && <InfoTemperatura />}
        </div>
    );
}
