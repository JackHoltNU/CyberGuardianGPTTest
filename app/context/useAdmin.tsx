'use client'

import React, { useEffect } from 'react';
import { ReactNode, createContext, useContext, useState } from 'react';
import { UserCollection } from '../types/types';
import { signOut } from 'next-auth/react';

interface AdminContextType {
  users: UserCollection,
  addUser: (username: string, password: string, role: string) => void;
  loadUsers: () => void;
  deleteUser: (user: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }:AdminProviderProps) => { 
  const [ users, setUsers ] = useState<UserCollection>({ users: [] });

  const addUser = async (username: string, password: string, role: string) => {
    console.log(`submitting new user, context`);

    try {
        const response = await fetch('/api/addUser', {
          method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password, role}),
        });
  
        if(!response.ok){
          await handleResponseError(response);
        }
      } catch (error: any) {
        console.error(`Could not add user`);
        throw new Error(error.message);
      }
    loadUsers();
  }

  const loadUsers = async () => {
    try {
      const responseString = await fetch('/api/loadUsers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response: UserCollection = await responseString.json();
      //const sortedResponse = await sortChatCollectionByDate(response);
      setUsers(response);
    } catch (error: any) {
        console.error(`Could not get users`);
        throw new Error(error.message);
    }
  };

  const deleteUser = async (user: string) => {
    try {
        await fetch('/api/deleteUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({user}),
        });
      } catch (error: any) {
          console.error(`Could not delete user`);
          throw new Error(error.message);
      }
      loadUsers();
  }
  
  const handleResponseError = async (response: Response) => {
      console.log(response.status);
      if (response.status === 401){
        await signOut();
      }
  }     


  return (
    <AdminContext.Provider value={{
        users,
        addUser,
        loadUsers,
        deleteUser,
      }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}