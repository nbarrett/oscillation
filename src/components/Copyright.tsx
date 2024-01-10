import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import * as React from "react";

export function Copyright() {
    return (
        <Typography variant="body2" color="text.secondary" align="right">
            {'Copyright © '}
            <Link color="inherit" href="https://Oscillation.com/">
                Kerry Barrett
            </Link>{' '}
            1989-{new Date().getFullYear()}
        </Typography>
    );
}
