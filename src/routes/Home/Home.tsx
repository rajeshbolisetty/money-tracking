import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FileUpload from '../../components/FileUploader/FileUploader';
import TransactionTable from '../../components/TransactionsTable/TransactionsTable';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState('');

  const groupByOptions = ['None', 'Date', 'Type', 'Particulars'];

  const handleDataParsed = (data: any[]) => {
    setRows(data);
    setHeaders(data.length ? Object.keys(data[0]) : []);
  };

  const clearData = () => {
    setRows([]);
    setHeaders([]);
    setGroupBy('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const groupTransactions = (rows: any[], key: string) => {
    const trimmedKey = key.trim();
    return rows.reduce(
      (acc, row) => {
        const groupValue = row[trimmedKey] || 'Unknown';
        if (!acc[groupValue]) acc[groupValue] = [];
        acc[groupValue].push(row);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        py: 4,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={rows.length > 0 ? 4 : 2}
        >
          <Typography variant="h4" color="white">
            Money Tracker
          </Typography>

          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {!rows.length ? (
          <Card
            sx={{
              backgroundColor: '#1e1e1e',
              color: 'white',
              px: 4,
              py: 6,
              textAlign: 'center',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload your bank statements
              </Typography>
              <FileUpload
                fileFormats=".csv"
                text="Upload Now"
                onDataParsed={handleDataParsed}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              gap={2}
            >
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel sx={{ color: 'white' }}>Group By</InputLabel>
                <Select
                  value={groupBy}
                  label="Group By"
                  onChange={(e) => setGroupBy(e.target.value)}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  {groupByOptions.map((header) => (
                    <MenuItem
                      key={header}
                      value={header}
                      sx={{ color: 'black' }}
                    >
                      {header.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="error"
                onClick={clearData}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Clear All
              </Button>
            </Box>
            {groupBy ? (
              Object.entries(groupTransactions(rows, groupBy)).map(
                ([group, groupedRows]: [string, any]) => (
                  <Box key={group} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                      {group === 'Unknown' ? '' : group}
                    </Typography>
                    <TransactionTable headers={headers} rows={groupedRows} />
                  </Box>
                ),
              )
            ) : (
              <TransactionTable headers={headers} rows={rows} />
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Home;
