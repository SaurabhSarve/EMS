import LeaveCard from "./LeaveCard";
import { MdMedicalServices, MdOutlineBeachAccess } from "react-icons/md";
import { FaRegCalendarAlt } from "react-icons/fa";

const LeaveSummaryGrid = ({ leaveBalanceDetails = [] }) => {
   const {leaveBalance} = leaveBalanceDetails;
    return (
        <div className="px-[15px] md:flex md:gap-2 md:px-[30px]">

            <LeaveCard
                title="ANNUAL LEAVE"
                used={leaveBalance?.annual || 0}
                total={15}
                barColor="#0F1729"
                icon={<MdOutlineBeachAccess className="text-slate-200 hover:text-slate-300" />}
            />

            <LeaveCard
                title="SICK LEAVE"
                used={leaveBalance?.sick || 0}
                total={10}
                barColor="#10B981"
                icon={<MdMedicalServices className="text-green-100 hover:text-green-200" />}
            />

            <LeaveCard
                title="PERSONAL LEAVE"
                used={leaveBalance?.personal  || 0}
                total={12}
                barColor="#FBBF24"
                icon={<FaRegCalendarAlt className="text-yellow-100 hover:text-yellow-200" />}
            />

        </div>
    );
};

export default LeaveSummaryGrid;
