/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { DataGrid, GridRowParams } from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import SparkMD5 from "spark-md5";
import * as XLSX from "xlsx";
import { sendPost } from "../utils/ApiRequest";
import { AxiosResponse } from "axios";

const socket = io("http://localhost:5000", {
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

const sendFile = async (file: File): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  return await sendPost("upload", formData, {
    "Content-Type": "multipart/form-data",
  });
};

const openFile = async () => {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Excel Files",
          accept: {
            "application/vnd.ms-excel": [".xl", ".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    });
    const file = await fileHandle.getFile();
    return { fileHandle, file };
  } catch (error) {
    console.error("Error opening file:", error);
    return null;
  }
};

const readFile = async (fileHandle: FileSystemFileHandle) => {
  const file = await fileHandle.getFile();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
  });
  return worksheet;
};

const computeChecksums = (rows: any[]) => {
  return rows.map((row) => SparkMD5.hash(JSON.stringify(row)));
};

const watchFile = async (
  fileHandle: FileSystemFileHandle,
  filename: string,
  uniqueColIndex: number
) => {
  let previousRows = await readFile(fileHandle);
  let previousChecksums = computeChecksums(previousRows);

  const checkForChanges = async () => {
    const currentRows = await readFile(fileHandle);
    if (currentRows.length === previousRows.length) {
      const currentChecksums = computeChecksums(currentRows);

      const changedRows = currentChecksums
        .map((checksum, index) =>
          checksum !== previousChecksums[index] ? currentRows[index] : null
        )
        .filter((row) => row !== null)
        .map((row: any) => {
          return row.reduce((acc: any, value: any, idx: number) => {
            acc["id"] = row[uniqueColIndex];
            acc[`column_${idx}`] = value;
            return acc;
          }, {});
        });

      if (changedRows.length > 0) {
        console.log("UPDATE ROWS EMIT EVENT", changedRows);
        socket.emit("updateRows", {
          filename,
          rows: changedRows,
          uniqueColIndex,
        });
      }
      if (changedRows.length > 0) {
        previousRows = currentRows;
        previousChecksums = currentChecksums;
      }
    }

    const addedRows = currentRows.slice(previousRows.length);
    const deletedRows = previousRows.slice(currentRows.length);

    if (addedRows.length > 0) {
      console.log("ADD ROWS EMIT EVENT");
      socket.emit("addRows", { filename, rows: addedRows });
    }
    if (deletedRows.length > 0) {
      socket.emit("deleteRows", { filename, rows: deletedRows });
    }

    if (
      addedRows.length > 0 ||
      deletedRows.length > 0
    ) {
      previousRows = currentRows;
    }
  };

  setInterval(checkForChanges, 1000);
};

const FileWatcher = () => {
  const [rows, setRows] = useState<GridRowParams<any>[]>([]);
  const [columns, setColumns] = useState([]);
  const [changedRows, setChangedRows] = useState<GridRowParams<any>[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [filename, setFilename] = useState<string>("");
  const [uniqueColIndex, setUniqueColIndex] = useState(0);

  useEffect(() => {
    socket.on("receiveUpdateRows", (data) => {
      console.log("UPDATE ROWS RECEIVE EVENT", data.rows);
      console.log("PREV ROWS", rows);
      setRows((prevRows) => {
        const updatedRows = [...prevRows];
        data.rows.forEach((row: any) => {
          console.log("xxxxxxxxxxx", row, updatedRows);
          const index = updatedRows.findIndex(
            (r: any) =>
              r["column_" + uniqueColIndex] === row["column_" + uniqueColIndex]
          );
          if (index !== -1) {
            updatedRows[index] = row;
          }
        });
        return updatedRows;
      });
    });

    socket.on("receiveAddRows", (data) => {
      console.log("ADD ROWS RECEIVE EVENT");
      setRows((prevRows) => [...prevRows, ...data.rows]);
    });

    socket.on("receiveDeleteRows", (data) => {
      setRows((prevRows) =>
        prevRows.filter((row) => !data.rows.some((r: any) => r.id === row.id))
      );
    });

    return () => {
      socket.off("receiveUpdateRows");
      socket.off("receiveAddRows");
      socket.off("receiveDeleteRows");
    };
  }, []);

  const handleOpenFile = async () => {
    const fileData = await openFile();
    if (fileData) {
      const { fileHandle, file } = fileData;

      const response = await sendFile(file);

      const { filename } = response.data;
      setFilename(filename);

      const rows = await readFile(fileHandle);

      const headerRow: any = rows[0];
      const columns = headerRow.map((column: string, index: number) => ({
        field: `column_${index}`,
        headerName: column,
        width: 150,
      }));

      const dataRows = rows.slice(1).map((row: any, index) => ({
        id: index,
        ...row.reduce((acc: any, value: any, idx: number) => {
          acc[`column_${idx}`] = value;
          return acc;
        }, {}),
      }));

      setColumns(columns);
      setRows(dataRows);
      console.log(columns);
      watchFile(fileHandle, filename, uniqueColIndex);
    }
  };

  const handleRowClick = (params: any) => {
    setSelectedRow(params.row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    const updatedRow = {
      id: selectedRow.id,
      ...Object.keys(selectedRow).reduce((acc: any, key) => {
        if (key.startsWith("column_")) {
          acc[key] = selectedRow[key];
        }
        return acc;
      }, {}),
    };

    await sendPost("update_row", {
      filename,
      rowId: updatedRow.id,
      updatedRow,
      uniqueColIndex,
    });

    setRows((prevRows: any) =>
      prevRows.map((row: any) => (row.id === updatedRow.id ? updatedRow : row))
    );
    setOpen(false);
  };

  const getRowClassName = (params: any) => {
    return changedRows.some((row) => row.id === params.id) ? "changed-row" : "";
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "0 1em",
        height: "600px",
      }}
    >
      <Button
        variant="contained"
        color="primary"
        sx={{ marginTop: "1em" }}
        onClick={handleOpenFile}
      >
        Open File
      </Button>
      <DataGrid
        sx={{ marginTop: "1em" }}
        rows={rows}
        columns={columns}
        getRowClassName={getRowClassName}
        getRowId={(row: any) => row["column_" + uniqueColIndex]}
        autoPageSize
        onRowClick={handleRowClick}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Row</DialogTitle>
        <DialogContent>
          {selectedRow &&
            Object.keys(selectedRow)
              .filter((key) => key.startsWith("column_"))
              .map((key) => (
                <TextField
                  key={key}
                  margin="dense"
                  label={
                    columns[parseInt(key.replace("column_", ""))].headerName
                  }
                  fullWidth
                  value={selectedRow[key]}
                  onChange={(e) =>
                    setSelectedRow({ ...selectedRow, [key]: e.target.value })
                  }
                />
              ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FileWatcher;
