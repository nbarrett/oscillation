import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

const TickCrossIcon = ({isTick}) => {
    return isTick ? <CheckIcon color="success"/> : <ClearIcon color="error"/>;
};

export default TickCrossIcon;
