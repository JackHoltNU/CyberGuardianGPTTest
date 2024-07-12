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
        if(newRole !== "admin" && newRole !== "user"){
            return;
        }
        console.log("submitting role change");
        updateRole(username, newRole);
        setShowEditRole(false);
    }

    return (
        <>
            <li className="flex items-center w-full" key={username}>
                <div className="w-1/5">{username}</div>
                <div className="w-1/5">{role}</div>
                <div className="w-3/5 flex">
                    {username !== "admin" ? (
                        <>
                            <button className="w-1/5 m-2 bg-gray-300" onClick={() => setShowEditRole(!showEditRole)}>Change role</button>
                            <button className="w-1/5 m-2 bg-gray-300" onClick={() => setShowEditPassword(!showEditPassword)}>Change password</button>
                            <button className="w-1/5 m-2 bg-red-300" onClick={() => deleteUser(username)}>Delete user</button>
                        </>
                    ) : (
                        <button className="w-1/5 m-2 bg-gray-300" onClick={() => setShowEditPassword(!showEditPassword)}>Change password</button>
                    )}                    
                </div>
            </li>
            {showEditPassword && (
                <li className="flex items-center w-full" key={`${username}editpassword`}>
                    <div className="w-1/5"></div>
                    <div className="w-1/5"></div>
                    <div className="w-3/5 flex">
                        <label className="w-1/5 m-2 text-right">New Password:</label>
                        <input className="w-1/5 m-2 border-2" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}></input>
                        <button className="w-1/12 m-2 bg-green-300" onClick={() => submitPasswordChange()}>Submit</button>
                        <button className="w-1/12 m-2 bg-red-300" onClick={() => setShowEditRole(!showEditRole)}>Cancel</button>
                    </div>
                </li>
            )}
            {showEditRole && (
                <li className="flex items-center w-full" key={`${username}editrole`}>
                    <div className="w-1/5"></div>
                    <div className="w-1/5"></div>
                    <div className="w-3/5 flex">
                        <label className="w-1/5 m-2 text-right">New Role:</label>
                        <select name="role" className="w-1/5 m-2 pl-2" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button className="w-1/12 m-2 bg-green-300" onClick={() => submitRoleChange()}>Submit</button>
                        <button className="w-1/12 m-2 bg-red-300" onClick={() => setShowEditPassword(!showEditPassword)}>Cancel</button>
                    </div>
                </li>
            )}
        </>
    )   
}

export default User;