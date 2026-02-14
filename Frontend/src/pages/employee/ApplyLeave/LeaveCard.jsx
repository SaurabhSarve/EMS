import React from 'react'


const LeaveCard = ({
    title, used, total, progressColor, icon,
}) => {
    const percentage = Math.min((used / total) * 100, 100);

    return (
        <>
        <div className='mb-3 w-full'>

            <div className="bg-white md: rounded-2xl border border-slate-200 p-6 w-full ">

                {/* TOP */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium tracking-wide text-slate-500">
                            {title}
                        </p>

                        <div className="mt-2 flex items-end gap-2">
                            <h2 className="text-3xl font-bold text-slate-900">
                                {used}
                            </h2>
                            {/* <span className="text-sm text-slate-400 mb-1">
                                / {total} Days
                            </span> */}
                        </div>
                    </div>

                    {/* ICON */}
                    <div className=" text-4xl hover:text-slate-400 ">
                        {icon}
                    </div>
                </div>

                {/* PROGRESS BAR */}
                {/* <div className="mt-6 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${progressColor}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div> */}
            </div>
        </div>

        </>

    );
};

export default LeaveCard;
