'use client'

import React, { useEffect, useState } from "react";
import { useAdmin } from "../context/useAdmin";
import User from "./user";

const Users = () => {
    const { users, addUser, loadUsers, deleteUser } = useAdmin();
    const [ newUsername, setNewUsername ] = useState("");
    const [ newPassword, setNewPassword ] = useState("");
    const [ newRole, setNewRole ] = useState("user");
    


    useEffect(() => {
        loadUsers();
    },[])

    const submitNewUser = () => {
        if(newUsername.length < 3){
            // todo feedback
            return
        }
        if(newPassword.length <= 7){
            // todo feedback
            return
        }
        if(newRole !== "admin" && newRole !== "user" && newRole !== "comparison" && newRole !== "promptbuilder"){
            // todo feedback
            return
        }
        addUser(newUsername, newPassword, newRole);
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");
    }

    return (
      <main className="users">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Users</h1>
        
        {/* Users list with scrolling */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* Header */}
          <div className="flex w-full border-b border-gray-200 bg-gray-50 px-6 py-3 rounded-t-lg">
            <div className="w-1/5 font-semibold text-gray-700">Username</div>
            <div className="w-1/5 font-semibold text-gray-700">Role</div>
            <div className="w-3/5 font-semibold text-gray-700">Actions</div>
          </div>
          
          {/* Scrollable user list */}
          <div className="max-h-96 overflow-y-auto">
            <ul>
              {users.users.map((user) => {
                return (
                    <User username={user.username} role={user.role} key={`${user.username}_user`}/>
                )
              })}
            </ul>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Add New User</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="username" className="text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="role" className="text-sm font-medium text-gray-700 mb-2">Role</label>
              <select 
                name="role" 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="comparison">Comparison</option>
                <option value="promptbuilder">Prompt Builder</option>
              </select>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              onClick={() => submitNewUser()}
            >
              Add User
            </button>
          </div>
        </div>
        
        
      </main>
    );
}

export default Users;