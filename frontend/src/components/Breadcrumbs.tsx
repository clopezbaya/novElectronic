import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

const steps = [
    { name: 'Carrito', href: '/cart', icon: FaShoppingCart },
    { name: 'Checkout', href: '/checkout', icon: FaCreditCard },
    { name: 'Confirmación', href: '/order-confirmation', icon: FaCheckCircle },
];

interface BreadcrumbsProps {
    disableLinks?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ disableLinks = false }) => {
    const location = useLocation();

    const getStatus = (stepHref: string) => {
        const currentIndex = steps.findIndex(step => location.pathname.includes(step.href));
        const stepIndex = steps.findIndex(step => step.href === stepHref);

        if (stepIndex < currentIndex) return 'complete';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    const renderStep = (step: any, status: string) => {
        if (status === 'complete' && !disableLinks) {
            return (
                <Link
                    to={step.href}
                    className="relative w-8 h-8 flex items-center justify-center bg-secondary rounded-full hover:bg-opacity-90 z-10"
                >
                    <step.icon className="w-5 h-5 text-white" aria-hidden="true" />
                    <span className="sr-only">{step.name}</span>
                </Link>
            );
        }
        return (
            <div
                className={`relative w-8 h-8 flex items-center justify-center rounded-full z-10 ${
                    status === 'complete' ? 'bg-secondary' :
                    status === 'current' ? 'bg-white border-2 border-secondary' :
                    'bg-white border-2 border-gray-300'
                }`}
                aria-current={status === 'current' ? 'step' : undefined}
            >
                {status === 'current' ? (
                    <span className="h-2.5 w-2.5 bg-secondary rounded-full" aria-hidden="true" />
                ) : (
                    <step.icon className={`w-5 h-5 ${status === 'complete' ? 'text-white' : 'text-gray-400'}`} aria-hidden="true" />
                )}
                <span className="sr-only">{step.name}</span>
            </div>
        );
    };

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-6 text-center">Progreso de tu Compra</h2>
            <nav aria-label="Progress">
                <ol role="list" className="flex items-start justify-center">
                    {steps.map((step, stepIdx) => (
                        <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'px-8 sm:px-16' : 'px-4'}`}>
                            <div className="flex flex-col items-center">
                                {renderStep(step, getStatus(step.href))}
                                <span className="mt-2 text-sm font-medium text-gray-700">{step.name}</span>
                            </div>
                            {stepIdx !== steps.length - 1 ? (
                                <div className="absolute top-4 left-1/2 w-full -translate-x-1/2" aria-hidden="true">
                                    <div className={`h-0.5 w-full ${getStatus(steps[stepIdx+1].href) === 'upcoming' ? 'bg-gray-200' : 'bg-secondary'}`} />
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
};

export default Breadcrumbs;
