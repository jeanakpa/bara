import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { CameraAlt, Upload, CheckCircle, Error } from '@mui/icons-material';
import { LightPDFOCRService, OCRResult } from '../services/lightPDFOCRService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProposerOffrePage() {
  const [tabValue, setTabValue] = useState(0);
  const [employerInfo, setEmployerInfo] = useState({
    nom: '',
    prenom: '',
    cni: '',
    telephone: '',
    email: ''
  });
  const [cniImage, setCniImage] = useState<File | null>(null);
  const [cniPreview, setCniPreview] = useState<string>('');
  const [posterImage, setPosterImage] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [isProcessingCNI, setIsProcessingCNI] = useState(false);
  const [isProcessingPoster, setIsProcessingPoster] = useState(false);
  const [cniResult, setCniResult] = useState<OCRResult | null>(null);
  const [posterAnalysis, setPosterAnalysis] = useState<string>('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'cni' | 'poster') => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === 'cni') {
        setCniImage(file);
        setCniPreview(URL.createObjectURL(file));
        setCniResult(null);
      } else {
        setPosterImage(file);
        setPosterPreview(URL.createObjectURL(file));
        setPosterAnalysis('');
      }
    }
  };

  const handleCameraCapture = async (type: 'cni' | 'poster') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Attendre que la vidéo soit prête
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Capturer l'image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Convertir en blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${type}_capture.jpg`, { type: 'image/jpeg' });
          if (type === 'cni') {
            setCniImage(file);
            setCniPreview(URL.createObjectURL(file));
            setCniResult(null);
          } else {
            setPosterImage(file);
            setPosterPreview(URL.createObjectURL(file));
            setPosterAnalysis('');
          }
        }
      }, 'image/jpeg');

      // Arrêter la caméra
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Erreur lors de la capture:', error);
    }
  };

  const processCNIImage = async () => {
    if (!cniImage) return;

    setIsProcessingCNI(true);
    try {
      const result = await LightPDFOCRService.extractCNIInfo(cniImage);
      setCniResult(result);
      
      if (result.success) {
        setEmployerInfo(prev => ({
          ...prev,
          nom: result.nom,
          prenom: result.prenom,
          cni: result.cni
        }));
      }
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      setCniResult({
        cni: '',
        nom: '',
        prenom: '',
        success: false,
        error: 'Erreur lors du traitement de l\'image'
      });
    } finally {
      setIsProcessingCNI(false);
    }
  };

  const analyzePosterImage = async () => {
    if (!posterImage) return;

    setIsProcessingPoster(true);
    try {
      // Simulation d'analyse IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPosterAnalysis('Analyse terminée : Image de poster d\'emploi détectée et validée.');
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setPosterAnalysis('Erreur lors de l\'analyse de l\'image');
    } finally {
      setIsProcessingPoster(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Logique de soumission
    console.log('Soumission des données:', { employerInfo, posterImage });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        Proposer une Offre d'Emploi
      </Typography>
      
      <Paper elevation={3} sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Informations Employeur" />
          <Tab label="Poster d'Emploi" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Informations Personnelles
              </Typography>
              
              <TextField
                fullWidth
                label="Nom *"
                value={employerInfo.nom}
                onChange={(e) => setEmployerInfo(prev => ({ ...prev, nom: e.target.value }))}
                margin="normal"
                required
                InputProps={{
                  readOnly: !!(cniResult?.success && cniResult.nom)
                }}
              />
              
              <TextField
                fullWidth
                label="Prénom *"
                value={employerInfo.prenom}
                onChange={(e) => setEmployerInfo(prev => ({ ...prev, prenom: e.target.value }))}
                margin="normal"
                required
                InputProps={{
                  readOnly: !!(cniResult?.success && cniResult.prenom)
                }}
              />
              
              <TextField
                fullWidth
                label="Numéro CNI *"
                value={employerInfo.cni}
                onChange={(e) => setEmployerInfo(prev => ({ ...prev, cni: e.target.value }))}
                margin="normal"
                required
                InputProps={{
                  readOnly: !!(cniResult?.success && cniResult.cni)
                }}
              />
              
              <TextField
                fullWidth
                label="Téléphone *"
                value={employerInfo.telephone}
                onChange={(e) => setEmployerInfo(prev => ({ ...prev, telephone: e.target.value }))}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={employerInfo.email}
                onChange={(e) => setEmployerInfo(prev => ({ ...prev, email: e.target.value }))}
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Photo CNI
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="cni-upload"
                  type="file"
                  onChange={(e) => handleImageUpload(e, 'cni')}
                />
                <label htmlFor="cni-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Télécharger Photo CNI
                  </Button>
                </label>
                
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  fullWidth
                  onClick={() => handleCameraCapture('cni')}
                >
                  Prendre Photo CNI
                </Button>
              </Box>

              {cniPreview && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <img
                      src={cniPreview}
                      alt="Aperçu CNI"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </CardContent>
                </Card>
              )}

              {cniImage && (
                <Button
                  variant="contained"
                  onClick={processCNIImage}
                  disabled={isProcessingCNI}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {isProcessingCNI ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Traitement en cours...
                    </>
                  ) : (
                    'Extraire les Informations'
                  )}
                </Button>
              )}

              {cniResult && (
                <Alert
                  severity={cniResult.success ? 'success' : 'error'}
                  icon={cniResult.success ? <CheckCircle /> : <Error />}
                  sx={{ mb: 2 }}
                >
                  {cniResult.success ? (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Informations extraites avec succès :
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {cniResult.cni && (
                          <Chip label={`CNI: ${cniResult.cni}`} color="primary" sx={{ mr: 1, mb: 1 }} />
                        )}
                        {cniResult.nom && (
                          <Chip label={`Nom: ${cniResult.nom}`} color="secondary" sx={{ mr: 1, mb: 1 }} />
                        )}
                        {cniResult.prenom && (
                          <Chip label={`Prénom: ${cniResult.prenom}`} color="secondary" sx={{ mr: 1, mb: 1 }} />
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2">
                      Erreur: {cniResult.error}
                    </Typography>
                  )}
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Poster d'Emploi
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="poster-upload"
                  type="file"
                  onChange={(e) => handleImageUpload(e, 'poster')}
                />
                <label htmlFor="poster-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Télécharger Poster
                  </Button>
                </label>
                
                <Button
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  fullWidth
                  onClick={() => handleCameraCapture('poster')}
                >
                  Prendre Photo Poster
                </Button>
              </Box>

              {posterPreview && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <img
                      src={posterPreview}
                      alt="Aperçu Poster"
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                    />
                  </CardContent>
                </Card>
              )}

              {posterImage && (
                <Button
                  variant="contained"
                  onClick={analyzePosterImage}
                  disabled={isProcessingPoster}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {isProcessingPoster ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Analyse en cours...
                    </>
                  ) : (
                    'Analyser le Poster'
                  )}
                </Button>
              )}

              {posterAnalysis && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {posterAnalysis}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Résumé de l'Offre
              </Typography>
              
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Employeur: {employerInfo.nom} {employerInfo.prenom}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    CNI: {employerInfo.cni}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Contact: {employerInfo.telephone} | {employerInfo.email}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    Poster: {posterImage ? 'Image téléchargée' : 'Aucune image'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!employerInfo.nom || !employerInfo.prenom || !employerInfo.cni || !posterImage}
        >
          Publier l'Offre d'Emploi
        </Button>
      </Box>
    </Container>
  );
} 