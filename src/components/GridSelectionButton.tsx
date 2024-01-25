import React from 'react';
import { Button } from "@mui/material";
import { colours } from '../models/game-models';
import { SetterOrUpdater, useRecoilState, useSetRecoilState } from "recoil";
import { gridClearRequestState, selectedGridSquaresState } from "../atoms/game-atoms";
import { SelectedGrid } from "./SelectGridSquares";
import { pluraliseWithCount } from "../util/strings";

export function GridSelectionButton() {

    const setGridClearRequest: SetterOrUpdater<number> = useSetRecoilState<number>(gridClearRequestState);

    const [selectedGridSquares, setSelectedGridSquares]: [SelectedGrid[], SetterOrUpdater<SelectedGrid[]>] = useRecoilState<SelectedGrid[]>(selectedGridSquaresState);

    function clearSelections() {
        setGridClearRequest(existing => existing + 1);
    }

    return selectedGridSquares.length > 0 ? <Button variant="contained"
                                                    color="primary"
                                                    onClick={clearSelections}
                                                    disabled={false}
                                                    sx={{
                                                        '&': {
                                                            backgroundColor: colours.osMapsPurple,
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: colours.osMapsPink,
                                                        },
                                                    }}>Clear {pluraliseWithCount(selectedGridSquares.length, "Move")}</Button> : null;
}
