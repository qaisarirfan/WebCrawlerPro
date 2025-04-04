import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

// Tutorial steps
const tutorialSteps = [
  {
    label: 'Welcome to the Web Crawler',
    description: 'This tool helps you extract WhatsApp group links from websites. Follow this quick tutorial to get started.',
    icon: <PlayArrowIcon color="primary" />
  },
  {
    label: 'Add URLs to Crawl',
    description: 'Click the "Add URL" button in the top-right corner to add websites containing WhatsApp links that you want to crawl.',
    icon: <AddIcon color="primary" />
  },
  {
    label: 'Configure Crawler Settings',
    description: 'Use the Settings button to customize crawler behavior such as concurrency, request limits, and more.',
    icon: <SettingsIcon color="primary" />
  },
  {
    label: 'Start Crawling',
    description: 'Click the "Start Crawler" button to begin crawling all the URLs you\'ve added, or crawl a single URL by clicking the refresh icon next to it.',
    icon: <RefreshIcon color="primary" />
  },
  {
    label: 'View Results',
    description: 'The Results panel shows all WhatsApp group links discovered during the crawl process, organized by domain.',
    icon: <StorageIcon color="primary" />
  }
];

const QuickStartTutorial: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showAgain, setShowAgain] = useState(true);

  // Check if the tutorial should be shown (on first visit)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    if (!showAgain) {
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <>
      {/* Button to reopen the tutorial */}
      <Button 
        variant="outlined" 
        color="primary" 
        onClick={() => setOpen(true)}
        startIcon={<PlayArrowIcon />}
        size="small"
      >
        Tutorial
      </Button>

      {/* Tutorial Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="tutorial-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="tutorial-dialog-title" sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div">
              Quick Start Guide
            </Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={handleClose} 
              aria-label="close"
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Stepper activeStep={activeStep} orientation="vertical">
            {tutorialSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  optional={
                    index === tutorialSteps.length - 1 ? (
                      <Typography variant="caption">Last step</Typography>
                    ) : null
                  }
                  icon={step.icon}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography>{step.description}</Typography>
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === tutorialSteps.length - 1 ? 'Finish' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === tutorialSteps.length && (
            <Paper square elevation={0} sx={{ p: 3, mt: 2, bgcolor: 'background.paper' }}>
              <Typography>All steps completed - you&apos;re ready to use the crawler!</Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Restart Tutorial
              </Button>
            </Paper>
          )}
        </DialogContent>
        
        <DialogActions>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between" 
            width="100%" 
            px={2} 
            py={1}
          >
            <Box display="flex" alignItems="center">
              <Button 
                onClick={() => setShowAgain(!showAgain)} 
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                {showAgain ? "Don't show again" : "Show on startup"}
              </Button>
            </Box>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickStartTutorial;