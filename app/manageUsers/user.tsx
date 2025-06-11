'use client'

import React, { useState } from "react";
import { useAdmin } from "../context/useAdmin";

interface Props {
    username: string,
    role: string
}

const User = ({ username, role }:Props) => {
    const { deleteUser, updatePassword, updateRole } = useAdmin();

    const [ showEditPassword, setShowEditPassword ] = useState(false);
    const [ newPassword, setNewPassword ] = useState("");
    const [ showEditRole, setShowEditRole ] = useState(false);
    const [ newRole, setNewRole ] = useState(role);

    const submitPasswordChange = () => {
        if(newPassword.length < 8){
            return;
        }
        updatePassword(username, newPassword);
        setNewPassword("");
        setShowEditPassword(false);
    }

    const submitRoleChange = () => {
        if(newRole !== "admin" && newRole !== "user" && newRole !== "comparison" && newRole !== "promptbuilder"){
            return;
        }
        updateRole(username, newRole);
        setShowEditRole(false);
    }

    return (
        <>
            <li className="flex items-center w-full px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150" key={username}>
                <div className="w-1/5 text-gray-800 font-medium">{username}</div>
                <div className="w-1/5">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    role === 'admin' ? 'bg-red-100 text-red-800' :
                    role === 'comparison' ? 'bg-purple-100 text-purple-800' :
                    role === 'promptbuilder' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {role}
                  </span>
                </div>
                <div className="w-3/5 flex gap-2">
                    {username !== "admin" ? (
                        <>
                            <button 
                              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                              onClick={() => setShowEditRole(!showEditRole)}
                            >
                              Change role
                            </button>
                            <button 
                              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                            >
                              Change password
                            </button>
                            <button 
                              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors duration-200"
                              onClick={() => deleteUser(username)}
                            >
                              Delete user
                            </button>
                        </>
                    ) : (
                        <button 
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          Change password
                        </button>
                    )}                    
                </div>
            </li>
            {showEditPassword && (
                <li className="w-full bg-blue-50 border-b border-gray-100" key={`${username}editpassword`}>
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700 min-w-fit">New Password:</label>
                            <input 
                              className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              type="password" 
                              value={newPassword} 
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                            />
                            <button 
                              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                              onClick={() => submitPasswordChange()}
                            >
                              Submit
                            </button>
                            <button 
                              className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                              onClick={() => setShowEditPassword(false)}
                            >
                              Cancel
                            </button>
                        </div>
                    </div>
                </li>
            )}
            {showEditRole && (
                <li className="w-full bg-purple-50 border-b border-gray-100" key={`${username}editrole`}>
                    <div className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700 min-w-fit">New Role:</label>
                            <select 
                              name="role" 
                              className="flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              value={newRole} 
                              onChange={(e) => setNewRole(e.target.value)}
                            >
                                <option value="user">User</option>
                                <option value="comparison">Comparison</option>
                                <option value="promptbuilder">Prompt Builder</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button 
                              className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                              onClick={() => submitRoleChange()}
                            >
                              Submit
                            </button>
                            <button 
                              className="px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                              onClick={() => setShowEditRole(false)}
                            >
                              Cancel
                            </button>
                        </div>
                    </div>
                </li>
            )}
        </>
    )   
}

export default User;