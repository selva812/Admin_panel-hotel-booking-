// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";
// import {
//     FiPlus,
//     FiUser,
//     FiMail,
//     FiPhone,
//     FiMapPin,
//     FiEdit2,
//     FiEye,
//     FiSearch,
//     FiFilter
// } from 'react-icons/fi';
// import AddUserModal from "./usermodal";
// import { useAuth } from "@/contexts/AuthContext";
// import { TransparentLoader } from "@/components/transparent";

// type User = {
//     id: number;
//     name: string;
//     email: string;
//     role: number; // 0: Staff, 1: Admin, 2: Manager
//     phone: string;
//     address: string;
// }

// type RoleFilter = "ALL" | "ADMIN" | "MANAGER" | "STAFF";

// // Role mapping constants
// const ROLE_MAPPING = {
//     STAFF: 0,
//     ADMIN: 1,
//     MANAGER: 2
// } as const;

// const REVERSE_ROLE_MAPPING = {
//     0: "STAFF",
//     1: "ADMIN",
//     2: "MANAGER"
// } as const;


// export default function AddUserPage() {
//     const router = useRouter();
//     const { user } = useAuth()
//     const [users, setUsers] = useState<User[]>([]);
//     const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [searchName, setSearchName] = useState("");
//     const [activeRoleFilter, setActiveRoleFilter] = useState<RoleFilter>("ALL");
//     const [showModal, setShowModal] = useState(false)
//     const fetchUsers = async () => {
//         setLoading(true);
//         try {
//             const token = localStorage.getItem('token');

//             const res = await axios.get('/api/users', {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });

//             setUsers(res.data);
//             setFilteredUsers(res.data);
//         } catch (err) {
//             console.error("Failed to fetch users", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleEdit = (userId: number) => {
//         router.push(`/dashboards/staff/edit?userId=${userId}`);
//     };

//     const getRoleChipStyles = (role: RoleFilter) => {
//         const baseStyles = "px-3 py-1.5 rounded-full text-sm font-medium transition-all";
//         const isActive = activeRoleFilter === role;

//         const styles = {
//             ALL: isActive
//                 ? "bg-gray-200 text-gray-800"
//                 : "bg-gray-100 text-gray-600 hover:bg-gray-200",
//             ADMIN: isActive
//                 ? "bg-red-200 text-red-800"
//                 : "bg-red-50 text-red-600 hover:bg-red-100",
//             MANAGER: isActive
//                 ? "bg-purple-200 text-purple-800"
//                 : "bg-purple-50 text-purple-600 hover:bg-purple-100",
//             STAFF: isActive
//                 ? "bg-blue-200 text-blue-800"
//                 : "bg-blue-50 text-blue-600 hover:bg-blue-100",
//         };

//         return `${baseStyles} ${styles[role]}`;
//     };

//     const handleRoleFilter = (role: RoleFilter) => {
//         setActiveRoleFilter(role);
//         if (role === "ALL") {
//             if (searchName) {
//                 applyNameFilter(searchName);
//             } else {
//                 setFilteredUsers(users);
//             }
//         } else {
//             // Get the numeric value for the role
//             const numericRole = ROLE_MAPPING[role];
//             const roleFiltered = users.filter(user => user.role === numericRole);

//             if (searchName) {
//                 const nameFiltered = roleFiltered.filter(user =>
//                     user.name.toLowerCase().includes(searchName.toLowerCase())
//                 );
//                 setFilteredUsers(nameFiltered);
//             } else {
//                 setFilteredUsers(roleFiltered);
//             }
//         }
//     };

//     // Update your applyNameFilter function
//     const applyNameFilter = (name: string) => {
//         let baseUsers = users;

//         if (activeRoleFilter !== "ALL") {
//             const numericRole = ROLE_MAPPING[activeRoleFilter];
//             baseUsers = users.filter(user => user.role === numericRole);
//         }

//         if (!name.trim()) {
//             setFilteredUsers(baseUsers);
//         } else {
//             const filtered = baseUsers.filter(user =>
//                 user.name.toLowerCase().includes(name.toLowerCase())
//             );
//             setFilteredUsers(filtered);
//         }
//     };

//     // Utility function to convert numeric role to display text
//     const getRoleDisplayText = (role: number): string => {
//         return REVERSE_ROLE_MAPPING[role as keyof typeof REVERSE_ROLE_MAPPING] || "UNKNOWN";
//     };

//     const handleSearchSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         applyNameFilter(searchName);
//     };

//     useEffect(() => {
//         fetchUsers();
//     }, []);



//     if (user?.role !== 'ADMIN') {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//                 <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-red-100">
//                     {/* Back Arrow */}
//                     <button
//                         onClick={() => router.back()}
//                         className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
//                     >
//                         <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             className="h-6 w-6"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                             stroke="currentColor"
//                         >
//                             <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                             />
//                         </svg>
//                     </button>

//                     {/* Error Icon */}
//                     <div className="mx-auto mb-4">
//                         <svg
//                             className="h-16 w-16 text-red-500 mx-auto"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                             xmlns="http://www.w3.org/2000/svg"
//                         >
//                             <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                             />
//                         </svg>
//                     </div>

//                     {/* Message */}
//                     <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
//                     <p className="text-gray-600 mb-4">
//                         You don't have permission to view this page.
//                         <br />
//                         Please contact your administrator for assistance.
//                     </p>
//                 </div>
//             </div>
//         );
//     }
//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             <div className="max-w-7xl mx-auto">
//                 <div className="flex justify-between items-center mb-6">
//                     <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
//                     <button
//                         onClick={() => setShowModal(true)}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
//                     >
//                         <FiPlus className="text-lg" />
//                         Add Staff
//                     </button>
//                 </div>

//                 {/* Filter Section */}
//                 <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
//                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                         {/* Role Filter */}
//                         <div className="flex flex-wrap gap-2 items-center">
//                             <div className="flex items-center text-gray-700 mr-2">
//                                 <FiFilter className="mr-2" />
//                                 <span className="font-medium">Filter by:</span>
//                             </div>
//                             <button
//                                 onClick={() => handleRoleFilter("ALL")}
//                                 className={getRoleChipStyles("ALL")}
//                             >
//                                 All
//                             </button>
//                             <button
//                                 onClick={() => handleRoleFilter("ADMIN")}
//                                 className={getRoleChipStyles("ADMIN")}
//                             >
//                                 Admin
//                             </button>
//                             <button
//                                 onClick={() => handleRoleFilter("MANAGER")}
//                                 className={getRoleChipStyles("MANAGER")}
//                             >
//                                 Manager
//                             </button>
//                             <button
//                                 onClick={() => handleRoleFilter("STAFF")}
//                                 className={getRoleChipStyles("STAFF")}
//                             >
//                                 Staff
//                             </button>
//                         </div>

//                         {/* Name Search */}
//                         <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto">
//                             <div className="relative flex-grow">
//                                 <input
//                                     type="text"
//                                     placeholder="Search by name..."
//                                     value={searchName}
//                                     onChange={(e) => setSearchName(e.target.value)}
//                                     className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
//                                 />
//                                 <FiSearch className="absolute left-3 top-3 text-gray-400" />
//                             </div>
//                             <button
//                                 type="submit"
//                                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition-all"
//                             >
//                                 Apply
//                             </button>
//                         </form>
//                     </div>
//                 </div>

//                 {loading ? (
//                     <TransparentLoader />
//                 ) : filteredUsers.length === 0 ? (
//                     <div className="bg-white rounded-xl p-8 text-center shadow-sm">
//                         <div className="text-gray-500 mb-2">No users match your filters</div>
//                         <button
//                             onClick={() => {
//                                 setActiveRoleFilter("ALL");
//                                 setSearchName("");
//                                 setFilteredUsers(users);
//                             }}
//                             className="text-blue-600 hover:text-blue-800 font-medium"
//                         >
//                             Clear all filters
//                         </button>
//                     </div>
//                 ) : (
//                     <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
//                         {filteredUsers.map((user) => {
//                             const roleColor = {
//                                 1: 'bg-red-100 text-red-800',
//                                 2: 'bg-purple-100 text-purple-800',
//                                 0: 'bg-blue-100 text-blue-800'
//                             }[user.role];

//                             return (
//                                 <div
//                                     key={user.id}
//                                     className="relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
//                                 >
//                                     {/* Card Header with color bar based on role */}
//                                     <div className={`h-2 w-full ${user.role === 1 ? 'bg-red-500' :
//                                         user.role === 2 ? 'bg-purple-500' :
//                                             'bg-blue-500'
//                                         }`} />

//                                     <div className="p-5">
//                                         <div className="flex items-start gap-4">
//                                             {/* Avatar with gradient based on role */}
//                                             <div className="flex-shrink-0">
//                                                 <div className={`w-14 h-14 rounded-full flex items-center justify-center ${user.role === 1 ? 'bg-gradient-to-br from-red-100 to-red-200' :
//                                                     user.role === 2 ? 'bg-gradient-to-br from-purple-100 to-purple-200' :
//                                                         'bg-gradient-to-br from-blue-100 to-blue-200'
//                                                     }`}>
//                                                     <FiUser className={`text-xl ${user.role === 1 ? 'text-red-600' :
//                                                         user.role === 2 ? 'text-purple-600' :
//                                                             'text-blue-600'
//                                                         }`} />
//                                                 </div>
//                                             </div>

//                                             {/* User Details */}
//                                             <div className="flex-1 min-w-0">
//                                                 <div className="flex items-center gap-2 mb-2">
//                                                     <h2 className="text-lg font-semibold text-gray-800 truncate">{user.name}</h2>
//                                                     <span className={`${roleColor} px-2 py-0.5 rounded-full text-xs font-medium`}>
//                                                         {user.role === 1 ? 'Admin' :
//                                                             user.role === 2 ? 'Manager' : 'Staff'}
//                                                     </span>
//                                                 </div>

//                                                 <div className="space-y-2 text-sm">
//                                                     <div className="flex items-center gap-2 text-gray-600">
//                                                         <FiMail className="flex-shrink-0 text-gray-400" />
//                                                         <span className="truncate">{user.email}</span>
//                                                     </div>
//                                                     <div className="flex items-center gap-2 text-gray-600">
//                                                         <FiPhone className="flex-shrink-0 text-gray-400" />
//                                                         <span className="truncate">{user.phone}</span>
//                                                     </div>
//                                                     <div className="flex items-center gap-2 text-gray-600">
//                                                         <FiMapPin className="flex-shrink-0 text-gray-400" />
//                                                         <span className="truncate">{user.address}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>

//                                         {/* Action Buttons */}
//                                         <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
//                                             <button
//                                                 onClick={() => handleEdit(user.id)}
//                                                 className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
//                                             >
//                                                 <FiEdit2 className="text-sm" />
//                                                 <span className="text-sm font-medium">Edit</span>
//                                             </button>

//                                             <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50">
//                                                 <FiEye className="text-sm" />
//                                                 <span className="text-sm font-medium">View</span>
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}
//             </div>
//             {showModal && <AddUserModal onClose={() => setShowModal(false)} onUserAdded={fetchUsers} />}
//         </div>
//     );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    FiPlus,
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiEdit2,
    FiEye
} from 'react-icons/fi';
import AddUserModal from "./usermodal";
import { useAuth } from "@/contexts/AuthContext";
import { TransparentLoader } from "@/components/transparent";

type User = {
    id: number;
    name: string;
    email: string;
    role: number; // 0: Staff, 1: Admin, 2: Manager
    phone: string;
    address: string;
};

export default function AddUserPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure role is number
            const normalizedUsers = res.data.map((u: User) => ({
                ...u,
                role: Number(u.role)
            }));

            setUsers(normalizedUsers);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (userId: number) => {
        try {
            setLoading(true)
            router.push(`/dashboards/staff/edit?userId=${userId}`);
        } catch (error) {
            console.log('err', error)
        } finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (user?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-red-100">
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                    </button>

                    <div className="mx-auto mb-4">
                        <svg
                            className="h-16 w-16 text-red-500 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You don't have permission to view this page.
                        <br />
                        Please contact your administrator for assistance.
                    </p>
                </div>
            </div>
        );
    }
    if (loading) {
        return <TransparentLoader />;
    }
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <FiPlus className="text-lg" />
                        Add Staff
                    </button>
                </div>

                {loading ? (
                    <TransparentLoader />
                ) : users.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                        <div className="text-gray-500 mb-2">No users found</div>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {users.map((user) => {
                            const roleColor = {
                                1: 'bg-red-100 text-red-800',
                                2: 'bg-purple-100 text-purple-800',
                                0: 'bg-blue-100 text-blue-800'
                            }[user.role];

                            return (
                                <div
                                    key={user.id}
                                    className="relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                                >
                                    <div className={`h-2 w-full ${user.role === 1 ? 'bg-red-500' :
                                        user.role === 2 ? 'bg-purple-500' :
                                            'bg-blue-500'
                                        }`} />

                                    <div className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${user.role === 1 ? 'bg-gradient-to-br from-red-100 to-red-200' :
                                                    user.role === 2 ? 'bg-gradient-to-br from-purple-100 to-purple-200' :
                                                        'bg-gradient-to-br from-blue-100 to-blue-200'
                                                    }`}>
                                                    <FiUser className={`text-xl ${user.role === 1 ? 'text-red-600' :
                                                        user.role === 2 ? 'text-purple-600' :
                                                            'text-blue-600'
                                                        }`} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h2 className="text-lg font-semibold text-gray-800 truncate">{user.name}</h2>
                                                    <span className={`${roleColor} px-2 py-0.5 rounded-full text-xs font-medium`}>
                                                        {user.role === 1 ? 'Admin' :
                                                            user.role === 2 ? 'Manager' : 'Staff'}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FiMail className="flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FiPhone className="flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{user.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FiMapPin className="flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{user.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                            <button
                                                onClick={() => handleEdit(user.id)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
                                            >
                                                <FiEdit2 className="text-sm" />
                                                <span className="text-sm font-medium">Edit</span>
                                            </button>

                                            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50">
                                                <FiEye className="text-sm" />
                                                <span className="text-sm font-medium">View</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {showModal && <AddUserModal onClose={() => setShowModal(false)} onUserAdded={fetchUsers} />}
        </div>
    );
}
