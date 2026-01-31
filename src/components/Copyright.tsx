'use client';

import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="right">
      {'Copyright © '}
      <Link color="inherit" href="https://github.com/nbarrett/oscillation">
        Kerry Barrett
      </Link>{' '}
      1989-{new Date().getFullYear()}
    </Typography>
  );
}
