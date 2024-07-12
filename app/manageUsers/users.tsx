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
        if(newRole !== "admin" && newRole !== "user"){
            // todo feedback
            return
        }
        console.log(`submitting new user, component`);
        addUser(newUsername, newPassword, newRole);
        setNewUsername("");
        setNewPassword("");
        setNewRole("user");
    }

    return (
      <main className="users">
        <h1 className="text-lg font-bold mb-4">Users</h1>
        <ul>
          <li className="flex w-full border-b-4">
            <div className="w-1/5">Username</div>
            <div className="w-1/5">Role</div>
            <div className="w-3/5"></div>
          </li>
          {users.users.map((user) => {
            return (
                <User username={user.username} role={user.role} key={`${user.username}_user`}/>
            )
          })}
        </ul>
        <h2 className="mt-10 text-md font-bold">Add New User</h2>
        <div className="w-80 lg:w-full lg:flex md:items-center mt-2">
            <div className="flex w-full lg:w-1/4 justify-end my-2">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    className="border-2 ml-2 w-2/3"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                />
            </div>
            <div className="flex w-full lg:w-1/4 justify-end lg:ml-2 lg:my-2">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    className="border-2 ml-2 w-2/3"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>
            <div className="flex w-full lg:w-1/4  justify-end mt-2 md:my-2">
                <label htmlFor="role">Role</label>
                <select name="role" className="w-2/3 ml-2 pl-2" onChange={(e) => setNewRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button className="w-full lg:w-1/6 h-8 lg:h-6 bg-blue-200 mt-6 md:my-2 lg:ml-4 rounded-md" onClick={() => submitNewUser()}>Add</button>
        </div>
        
        
      </main>
    );
}

export default Users;