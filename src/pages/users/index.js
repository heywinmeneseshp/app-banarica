import React from 'react';
import { Container } from 'react-bootstrap';

//Components
import Users from '@containers/Users';


//CSS


export default function Home() {
    return (
        <div>
            <Container>
                <Users></Users>
            </Container>
        </div>
    )
}