import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { useEffect } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

var misoptions = {
    responsive : true,
    animation : false,
    plugins : {
        legend : {
            display : false
        }
    },
    scales : {
        y : {
            min : -1000,
            max : 1000
        },
        x: {
            ticks: { color: 'rgba(0, 220, 195)'}
        }
    }
};


export default function Bars(data, labels, title) {

    var midata = {
        labels: labels,
        datasets: [
            {
                label: title,
                data: data,
                backgroundColor: 'rgba(0, 220, 195, 0.5)'
            }
        ]
    };

    useEffect(()=>[data]);
    

    return (<Bar data={midata} options={misoptions} />);
}

