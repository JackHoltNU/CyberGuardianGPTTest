'use client'

import React, { useEffect, useState } from "react";
import { useAdmin } from "../context/useAdmin";

export default () => {
    const { users, addUser, loadUsers } = useAdmin();
    const [ newUsername, setNewUsername ] = useState("");
    const [ newPassword, setNewPassword ] = useState("");
    const [ newRole, setNewRole ] = useState("user");

    useEffect(() => {
        loadUsers();
    },[])

    const submitNewUser = () => {
        if(newUsername.length <= 3){
            // todo feedback
            return
        }
        if(newPassword.length <= 7){
            // todo feedback
            return
        }
        if(newRole !== "admin" && newRole !== "user"){
            // todo feedback
            return
        }
        console.log(`submitting new user, component`);
        addUser(newUsername, newPassword, newRole);
    }

    return (
      <main className="users">
        <h1 className="text-lg font-bold mb-4">Users</h1>
        <ul>
          <li className="flex w-full border-b-4">
            <div className="w-2/5">Username</div>
            <div className="w-2/5">Role</div>
            <div className="w-1/5"></div>
          </li>
          {users.users.map((user) => {
            return (
                <li className="flex w-full">
                    <div className="w-2/5">{user.username}</div>
                    <div className="w-2/5">{user.role}</div>
                    <div className="w-1/5"></div>
                </li>
            )
          })}
        </ul>
        <h2 className="mt-10 text-md font-bold">Add New User</h2>
        <div className="w-80 mt-2">
            <div className="flex w-full justify-end my-2">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    className="border-2 ml-2 w-2/3"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                />
            </div>
            <div className="flex w-full justify-end">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    className="border-2 ml-2 w-2/3"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>
            <div className="flex w-full justify-end mt-2">
                <label htmlFor="role">Role</label>
                <select name="role" className="w-2/3 ml-2 pl-2" onChange={(e) => setNewRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button className="w-full h-8 bg-blue-200 mt-6" onClick={() => submitNewUser()}>Add</button>
        </div>
        
        
      </main>
    );
}