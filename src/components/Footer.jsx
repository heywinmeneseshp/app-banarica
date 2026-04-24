import React from 'react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-primary text-white py-3 mt-4">
            <div className="container-fluid px-3 px-md-4 px-xl-5">
                <div className="text-center small">
                    <Link
                        href="https://www.craken.com.co/"
                        className="text-white text-decoration-none"
                    >
                        Â© 2022 Copyright: www.craken.com.co
                    </Link>
                </div>
            </div>
        </footer>
    );
}
