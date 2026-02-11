import React from 'react';
import { Check, X } from 'lucide-react';

interface DormProsConsSectionProps {
    title: string;
    goodLabel: string;
    notSoGoodLabel: string;
    pros: string[];
    cons: string[];
}

const DormProsConsSection: React.FC<DormProsConsSectionProps> = ({
    title,
    goodLabel,
    notSoGoodLabel,
    pros,
    cons
}) => {
    return (
        <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                        <Check size={18} className="mr-2" /> {goodLabel}
                    </h4>
                    <ul className="space-y-2">
                        {pros.map((pro, idx) => (
                            <li key={idx} className="text-green-700 text-sm flex items-start">
                                <span className="mr-2">-</span> {pro}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                        <X size={18} className="mr-2" /> {notSoGoodLabel}
                    </h4>
                    <ul className="space-y-2">
                        {cons.map((con, idx) => (
                            <li key={idx} className="text-red-700 text-sm flex items-start">
                                <span className="mr-2">-</span> {con}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default DormProsConsSection;
