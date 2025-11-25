import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Form } from 'react-router'
import { addActivities } from '../services/api';

const ActivityForm = ({ onActivityAdded }) => {

  const [activity, setActivity] = useState({
    type: 'RUNNING', duration: '', calories: '',
    additionalMetrics:{}
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       await addActivities(activity);
       onActivityAdded();
       setActivity({
          type: 'RUNNING', duration: '', calories: '',
          additionalMetrics:{}
        });
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }

  return (
    <Box component="form" sx={{ mb : 2 }} onSubmit={handleSubmit}>
      <FormControl   sx={{ mb: 2 }}>
        <InputLabel>Activity Type</InputLabel>
        <Select
          value={activity.type}
          onChange={ (e) => {setActivity({...activity, type: e.target.value })} }

        >
          <MenuItem value="RUNNING">RUNNING</MenuItem>
          <MenuItem value="CYCLING">CYCLING</MenuItem>
          <MenuItem value="SWIMMING">SWIMMING</MenuItem>
          <MenuItem value="YOGA">YOGA</MenuItem>
          <MenuItem value="WEIGHTLIFTING">WEIGHT LIFTING</MenuItem>
          <MenuItem value="HIKING">HIKING</MenuItem>
          <MenuItem value="DANCING">DANCING</MenuItem>
        </Select>
      </FormControl>

      <TextField fullWidth
        label="Duration (in minutes)"
        type= 'number'
        sx={{ mb : 2}}
        value={activity.duration}
        onChange={(e) => {setActivity({...activity, duration: e.target.value })}}
      />

      <TextField fullWidth
        label="Calories Burned"
        type= 'number'
        sx={{ mb : 2}}
        value={activity.calories}
        onChange={(e) => {setActivity({...activity, calories : e.target.value })}}
      />

      <Button type='submit' variant="contained" >
        Add Activity 
      </Button>

    </Box>
  )
}

export default ActivityForm