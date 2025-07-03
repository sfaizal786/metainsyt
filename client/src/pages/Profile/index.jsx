import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { Avatar, AvatarImage } from '@/components/ui/Avatar.jsx';
import { getColor, colors } from '@/lib/utils.js';
import { FaTrash, FaPlus } from 'react-icons/fa';
import { useAppStore } from '../../store';
import { Button } from '@/components/ui/button.tsx';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client.js';
import {
  ADD_PROFILE_IMAGE_ROUTE,
  HOST,
  REMOVE_PROFILE_IMAGES_ROUTE,
  UPDATE_PROFILE_ROUTE
} from '../../utils/constant.js';

function Profile() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();
  const [firstName, setfirstName] = useState('');
  const [lastName, setlastName] = useState('');
  const [image, setImage] = useState('');
  const [hovered, sethovered] = useState(false);
  const [selectedcolor, setselectedcolor] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (userInfo.profileSetup) {
      setfirstName(userInfo.firstName || '');
      setlastName(userInfo.lastName || '');
      setselectedcolor(
        userInfo.color !== undefined && userInfo.color !== null
          ? userInfo.color
          : 0
      );
    }
    if (userInfo.image) {
      setImage(`${HOST}/${userInfo.image}`);
    } else {
      setImage('');
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!firstName) {
      toast.error('First Name is Required');
      return false;
    }
    if (!lastName) {
      toast.error('Last Name is Required');
      return false;
    }
    if (selectedcolor === undefined || selectedcolor === null) {
      toast.error('Please select a color.');
      return false;
    }
    return true;
  };

  const saveChange = async () => {
    if (validateProfile()) {
      try {
        console.log({
          firstName,
          lastName,
          color: selectedcolor
        });

        const response = await apiClient.put(
          UPDATE_PROFILE_ROUTE,
          { firstName, lastName, color: selectedcolor },
          { withCredentials: true }
        );
        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success('Profile Updated Successfully');
          navigate('/chat');
        }
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data || 'Error updating profile');
      }
    }
  };

  const handleNavigate = () => {
    if (userInfo.profileSetup) {
      navigate('/chat');
    } else {
      toast.error('Please Setup Profile');
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile-image', file);
      try {
        const response = await apiClient.post(
          ADD_PROFILE_IMAGE_ROUTE,
          formData,
          { withCredentials: true }
        );
        if (response.status === 200 && response.data.image) {
          setUserInfo({ ...userInfo, ...response.data });
          toast.success('Image Updated Successfully');
        }
      } catch (error) {
        console.log(error);
        toast.error('Failed to upload image');
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await apiClient.delete(REMOVE_PROFILE_IMAGES_ROUTE, {
        withCredentials: true
      });
      if (response.status === 200) {
        setUserInfo({ ...userInfo, image: null });
        toast.success('Profile Image Removed Successfully');
        setImage('');
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className='bg-[#1b1c24] h-[100vh] flex items-center justify-center flex-col gap-10'>
      <div className='flex flex-col gap-10 w-[80vw] md:w-max'>
        <div onClick={handleNavigate}>
          <IoArrowBa
