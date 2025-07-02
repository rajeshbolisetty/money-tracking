import "./App.css";
import FileUpload from "./components/FileUploader/FileUploader";
import { useState } from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import TransactionTable from "./components/TransactionsTable/TransactionsTable";

function App() {
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleDataParsed = (data: any[]) => {
    setRows(data);
    setHeaders(data.length ? Object.keys(data[0]) : []);
  };

  const clearData = () => {
    setRows([]);
    setHeaders([]);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" gutterBottom>
          Money Tracker
        </Typography>
        {rows.length > 0 && (
          <Button
            sx={{
              bgcolor: "error.main",
              color: "text.primary",
              marginLeft: "1em",
            }}
            onClick={clearData}
          >
            Clear
          </Button>
        )}
      </Box>
      {!rows.length && (
        <FileUpload
          fileFormats=".csv, .xls, .xlsx"
          text="Upload your bank statements"
          onDataParsed={handleDataParsed}
        />
      )}
      <TransactionTable headers={headers} rows={rows}></TransactionTable>
    </Container>
  );
}

export default App;
