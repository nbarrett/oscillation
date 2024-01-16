import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

const TickCrossIcon = ({isTick}) => {
    return isTick ? <CheckIcon sx={{ml: 2}} color="success"/> : <ClearIcon sx={{ml: 2}} color="error"/>;
};

export default TickCrossIcon;
