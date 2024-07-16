'use client'

import React, { useEffect } from 'react';
import { ReactNode, createContext, useContext, useState } from 'react';
import { ChatCollection, MessageInstance, UserCollection } from '../types/types';
import { signOut } from 'next-auth/react';

interface AdminContextType {
  users: UserCollection,
  upvotedList: MessageInstance[],
  downvotedList: MessageInstance[],
  unvotedList: MessageInstance[],
  addUser: (username: string, password: string, role: string) => void;
  loadUsers: () => void;
  deleteUser: (user: string) => void;
  updatePassword: (username: string, password: string) => void;
  updateRole: (username: string, role: string) => void;
  getVotedOn: () => {};
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }:AdminProviderProps) => { 
  const [ users, setUsers ] = useState<UserCollection>({ users: [] });
  const [ upvotedList, setUpvotedList ] = useState<Array<MessageInstance>>([]);
  const [ downvotedList, setDownvotedList ] = useState<Array<MessageInstance>>([]);
  const [ unvotedList, setUnvotedList ] = useState<Array<MessageInstance>>([]);



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

  const updatePassword = async (username: string, password: string) => {
    try {
        await fetch('/api/updateUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username, password}),
        });
      } catch (error: any) {
          console.error(`Could not update user`);
          throw new Error(error.message);
      }
  }

  const updateRole = async (username: string, role: string) => {
    try {
        await fetch('/api/updateUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username, role}),
        });
      } catch (error: any) {
          console.error(`Could not update user`);
          throw new Error(error.message);
    }
    loadUsers();
  }

  const getVotedOn = async () => {
    try {
      const responseString = await fetch('/api/getVotedOn', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await responseString.json();
      setUpvotedList(response.upvoted);
      setDownvotedList(response.downvoted);
      setUnvotedList(response.unvoted);
    } catch (error: any) {
        console.error(`Could not get users`);
        throw new Error(error.message);
    }
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
        upvotedList,
        downvotedList,
        unvotedList,
        addUser,
        loadUsers,
        deleteUser,
        updatePassword,
        updateRole,
        getVotedOn
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