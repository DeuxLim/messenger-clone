import SidebarHeader from './sidebar/SidebarHeader.jsx';
import SidebarSearch from './sidebar/SidebarSearch.jsx';
import SidebarChats from './sidebar/SidebarChats.jsx';
import SidebarFooter from './sidebar/SidebarFooter.jsx';

export default function Sidebar() {

    return (
        <>
            {/* SIDEBAR */}
            <aside className="flex flex-col h-full rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-auto min-w-[250px] w-full md:flex-none md:w-[clamp(260px,34vw,480px)] xl:w-[480px]">

                {/* HEADER */}
                <SidebarHeader />

                {/* SEARCH CHATS */}
                <SidebarSearch />

                {/* CHATS LIST */}
                <SidebarChats />
            </aside>
        </>
    )
}
