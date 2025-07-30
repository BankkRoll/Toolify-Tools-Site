'use client';

import { ToolLayout } from '@/components/layout/tool-layout';
import { ActionButtons } from '@/components/tools/action-buttons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAnimations } from '@/stores/settings-store';
import { QrCode } from 'lucide-react';
import { m, useInView } from 'motion/react';
import QRBorderPlugin from 'qr-border-plugin';
import QRCodeStyling from 'qr-code-styling';
import { useRef, useState } from 'react';

/**
 * QR code type options
 */
type QRType = 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi';

/**
 * WiFi configuration interface
 */
interface WifiConfig {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

/**
 * QR code generator tool page
 */
export default function QRGeneratorPage() {
  const [qrType, setQrType] = useState<QRType>('text');
  const [qrData, setQrData] = useState('');
  const [qrSize, setQrSize] = useState([300]);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [errorCorrection, setErrorCorrection] = useState('M');
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [error, setError] = useState('');
  const [qrCodeInstance, setQrCodeInstance] = useState<any>(null);
  const [dotStyle, setDotStyle] = useState('square');
  const [cornerStyle, setCornerStyle] = useState('square');
  const [cornerDotStyle, setCornerDotStyle] = useState('square');
  const [showBorder, setShowBorder] = useState(false);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderThickness, setBorderThickness] = useState([10]);

  // WiFi specific fields
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });

  const [history, setHistory] = useLocalStorage<string[]>('qr-generator-history', []);
  const animationsEnabled = useAnimations();

  // Refs for motion animations
  const containerRef = useRef(null);
  const settingsSectionRef = useRef(null);
  const outputSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // InView hooks
  const containerInView = useInView(containerRef, { once: true, amount: 0.2 });
  const settingsSectionInView = useInView(settingsSectionRef, {
    once: true,
    amount: 0.2,
  });
  const outputSectionInView = useInView(outputSectionRef, {
    once: true,
    amount: 0.2,
  });
  const aboutSectionInView = useInView(aboutSectionRef, {
    once: true,
    amount: 0.2,
  });

  /**
   * Generates QR code data based on selected type
   */
  const generateQRData = (): string => {
    let data = '';

    switch (qrType) {
      case 'text':
        data = qrData;
        break;
      case 'url':
        data = qrData.startsWith('http') ? qrData : `https://${qrData}`;
        break;
      case 'email':
        data = `mailto:${qrData}`;
        break;
      case 'phone':
        data = `tel:${qrData}`;
        break;
      case 'sms':
        data = `sms:${qrData}`;
        break;
      case 'wifi':
        data = `WIFI:T:${wifiConfig.encryption};S:${wifiConfig.ssid};P:${wifiConfig.password};H:${wifiConfig.hidden};`;
        break;
    }

    return data;
  };

  /**
   * Generates QR code using qr-code-styling library
   */
  const generateQR = async (): Promise<void> => {
    const data = generateQRData();

    if (!data.trim()) {
      setError('Please enter data to generate QR code');
      return;
    }

    try {
      // Clear previous QR code
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = '';
      }

      const options: any = {
        width: qrSize[0],
        height: qrSize[0],
        type: 'svg',
        data: data,
        dotsOptions: {
          color: qrColor,
          type: dotStyle,
        },
        backgroundOptions: {
          color: bgColor,
        },
        cornersSquareOptions: {
          type: cornerStyle,
          color: qrColor,
        },
        cornersDotOptions: {
          type: cornerDotStyle,
          color: qrColor,
        },
        qrOptions: {
          errorCorrectionLevel: errorCorrection,
        },
      };

      const qrCode = new QRCodeStyling(options);

      // Apply border extension if enabled
      if (showBorder) {
        const borderOptions: any = {
          round: 0.1,
          thickness: borderThickness[0],
          color: borderColor,
          dasharray: '',
          borderInner: {
            color: borderColor,
            thickness: borderThickness[0] / 2,
          },
          borderOuter: {
            color: borderColor,
            thickness: borderThickness[0] / 2,
          },
        };

        qrCode.applyExtension(QRBorderPlugin(borderOptions));
      }

      // Append to container
      if (qrContainerRef.current) {
        qrCode.append(qrContainerRef.current);
      }

      setQrCodeInstance(qrCode);
      setGeneratedQR('generated');
      setError('');
      setHistory([`QR generated: ${qrType} (${qrSize[0]}px)`, ...history].slice(0, 10));
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR generation error:', err);
    }
  };

  /**
   * Downloads the generated QR code
   */
  const downloadQR = async (): Promise<void> => {
    if (!qrCodeInstance) return;

    try {
      await qrCodeInstance.download({
        name: `qr-code-${qrType}`,
        extension: 'png',
      });
    } catch (err) {
      setError('Failed to download QR code');
    }
  };

  /**
   * Clears all form data and generated QR code
   */
  const clearAll = (): void => {
    setQrData('');
    setQrSize([300]);
    setQrColor('#000000');
    setBgColor('#FFFFFF');
    setErrorCorrection('M');
    setGeneratedQR('');
    setError('');
    setDotStyle('square');
    setCornerStyle('square');
    setCornerDotStyle('square');
    setShowBorder(false);
    setBorderColor('#000000');
    setBorderThickness([10]);
    setQrCodeInstance(null);

    if (qrContainerRef.current) {
      qrContainerRef.current.innerHTML = '';
    }

    setWifiConfig({
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false,
    });
  };

  /**
   * Renders input fields based on QR code type
   */
  const renderInputFields = () => {
    switch (qrType) {
      case 'wifi':
        return (
          <MotionDiv
            className='space-y-4'
            initial={animationsEnabled ? { opacity: 0, height: 0 } : undefined}
            animate={animationsEnabled ? { opacity: 1, height: 'auto' } : undefined}
            transition={animationsEnabled ? { duration: 0.3 } : undefined}
          >
            <div className='space-y-2'>
              <Label htmlFor='ssid'>Network Name (SSID)</Label>
              <Input
                id='ssid'
                value={wifiConfig.ssid}
                onChange={e => setWifiConfig(prev => ({ ...prev, ssid: e.target.value }))}
                placeholder='Enter WiFi network name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={wifiConfig.password}
                onChange={e =>
                  setWifiConfig(prev => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder='Enter WiFi password'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='encryption'>Encryption Type</Label>
              <Select
                value={wifiConfig.encryption}
                onValueChange={(value: 'WPA' | 'WEP' | 'nopass') =>
                  setWifiConfig(prev => ({ ...prev, encryption: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='WPA'>WPA/WPA2/WPA3</SelectItem>
                  <SelectItem value='WEP'>WEP</SelectItem>
                  <SelectItem value='nopass'>No Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                id='hidden'
                checked={wifiConfig.hidden}
                onChange={e =>
                  setWifiConfig(prev => ({
                    ...prev,
                    hidden: e.target.checked,
                  }))
                }
                className='rounded'
              />
              <Label htmlFor='hidden'>Hidden Network</Label>
            </div>
          </MotionDiv>
        );
      default:
        return (
          <div className='space-y-2'>
            <Label htmlFor='qr-data'>
              {qrType === 'text' && 'Text'}
              {qrType === 'url' && 'URL'}
              {qrType === 'email' && 'Email Address'}
              {qrType === 'phone' && 'Phone Number'}
              {qrType === 'sms' && 'Phone Number'}
            </Label>
            <Input
              id='qr-data'
              value={qrData}
              onChange={e => setQrData(e.target.value)}
              placeholder={
                qrType === 'text'
                  ? 'Enter text...'
                  : qrType === 'url'
                    ? 'https://example.com'
                    : qrType === 'email'
                      ? 'user@example.com'
                      : qrType === 'phone'
                        ? '+1234567890'
                        : '+1234567890'
              }
            />
          </div>
        );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : 'div';

  return (
    <ToolLayout toolId='general-qr-generator'>
      <MotionDiv
        ref={containerRef}
        className='space-y-6'
        variants={animationsEnabled ? containerVariants : undefined}
        initial={animationsEnabled ? 'hidden' : undefined}
        animate={animationsEnabled ? (containerInView ? 'visible' : 'hidden') : undefined}
      >
        <MotionDiv
          ref={settingsSectionRef}
          className='grid gap-6 lg:grid-cols-2'
          variants={animationsEnabled ? containerVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (settingsSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>QR Code Settings</CardTitle>
                <CardDescription>Configure your QR code type and data</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='qr-type'>QR Code Type</Label>
                  <Select value={qrType} onValueChange={(value: QRType) => setQrType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='text'>Text</SelectItem>
                      <SelectItem value='url'>URL</SelectItem>
                      <SelectItem value='email'>Email</SelectItem>
                      <SelectItem value='phone'>Phone Number</SelectItem>
                      <SelectItem value='sms'>SMS</SelectItem>
                      <SelectItem value='wifi'>WiFi Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderInputFields()}

                <div className='space-y-2'>
                  <Label>Size: {qrSize[0]}px</Label>
                  <Slider
                    value={qrSize}
                    onValueChange={setQrSize}
                    max={512}
                    min={128}
                    step={32}
                    className='w-full'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='qr-color'>QR Color</Label>
                    <Input
                      id='qr-color'
                      type='color'
                      value={qrColor}
                      onChange={e => setQrColor(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='bg-color'>Background Color</Label>
                    <Input
                      id='bg-color'
                      type='color'
                      value={bgColor}
                      onChange={e => setBgColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dot-style'>Dot Style</Label>
                  <Select value={dotStyle} onValueChange={setDotStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='square'>Square</SelectItem>
                      <SelectItem value='dots'>Dots</SelectItem>
                      <SelectItem value='rounded'>Rounded</SelectItem>
                      <SelectItem value='classy'>Classy</SelectItem>
                      <SelectItem value='classy-rounded'>Classy Rounded</SelectItem>
                      <SelectItem value='extra-rounded'>Extra Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='corner-style'>Corner Style</Label>
                    <Select value={cornerStyle} onValueChange={setCornerStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='square'>Square</SelectItem>
                        <SelectItem value='dot'>Dot</SelectItem>
                        <SelectItem value='rounded'>Rounded</SelectItem>
                        <SelectItem value='extra-rounded'>Extra Rounded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='corner-dot-style'>Corner Dot Style</Label>
                    <Select value={cornerDotStyle} onValueChange={setCornerDotStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='square'>Square</SelectItem>
                        <SelectItem value='dot'>Dot</SelectItem>
                        <SelectItem value='rounded'>Rounded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='error-correction'>Error Correction</Label>
                  <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='L'>Low (7%)</SelectItem>
                      <SelectItem value='M'>Medium (15%)</SelectItem>
                      <SelectItem value='Q'>Quartile (25%)</SelectItem>
                      <SelectItem value='H'>High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-4'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='show-border'
                      checked={showBorder}
                      onChange={e => setShowBorder(e.target.checked)}
                      className='rounded'
                    />
                    <Label htmlFor='show-border'>Show Border</Label>
                  </div>

                  {showBorder && (
                    <MotionDiv
                      className='space-y-4'
                      initial={animationsEnabled ? { opacity: 0, height: 0 } : undefined}
                      animate={animationsEnabled ? { opacity: 1, height: 'auto' } : undefined}
                      transition={animationsEnabled ? { duration: 0.3 } : undefined}
                    >
                      <div className='space-y-2'>
                        <Label>Border Thickness: {borderThickness[0]}px</Label>
                        <Slider
                          value={borderThickness}
                          onValueChange={setBorderThickness}
                          max={50}
                          min={1}
                          step={1}
                          className='w-full'
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='border-color'>Border Color</Label>
                        <Input
                          id='border-color'
                          type='color'
                          value={borderColor}
                          onChange={e => setBorderColor(e.target.value)}
                        />
                      </div>
                    </MotionDiv>
                  )}
                </div>

                <ActionButtons
                  onGenerate={generateQR}
                  generateLabel='Generate QR Code'
                  onReset={clearAll}
                  resetLabel='Clear'
                  variant='outline'
                  size='sm'
                />
              </CardContent>
            </Card>
          </MotionDiv>

          <MotionDiv variants={animationsEnabled ? cardVariants : undefined}>
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
                <CardDescription>Your QR code will appear here</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {generatedQR ? (
                  <MotionDiv
                    className='space-y-4'
                    initial={animationsEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                    animate={animationsEnabled ? { opacity: 1, scale: 1 } : undefined}
                    transition={animationsEnabled ? { duration: 0.3 } : undefined}
                  >
                    <div className='flex justify-center'>
                      <div ref={qrContainerRef} className='border rounded-lg p-4 bg-white' />
                    </div>

                    <ActionButtons onDownload={downloadQR} variant='outline' size='sm' />
                  </MotionDiv>
                ) : (
                  <div className='flex items-center justify-center h-64 border-2 border-dashed rounded-lg'>
                    <div className='text-center'>
                      <QrCode className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                      <p className='text-muted-foreground'>
                        Click "Generate QR Code" to create your QR code
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </MotionDiv>
        </MotionDiv>

        <MotionDiv
          ref={aboutSectionRef}
          variants={animationsEnabled ? cardVariants : undefined}
          initial={animationsEnabled ? 'hidden' : undefined}
          animate={animationsEnabled ? (aboutSectionInView ? 'visible' : 'hidden') : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle>About QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <MotionDiv
                  initial={animationsEnabled ? { opacity: 0, x: -20 } : undefined}
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.1 } : undefined}
                >
                  <h4 className='font-medium mb-2'>What are QR Codes?</h4>
                  <p className='text-muted-foreground'>
                    QR (Quick Response) codes are two-dimensional barcodes that can store various
                    types of data including text, URLs, contact information, and more. They can be
                    scanned by smartphones and other devices with cameras.
                  </p>
                </MotionDiv>
                <MotionDiv
                  initial={animationsEnabled ? { opacity: 0, x: 20 } : undefined}
                  animate={animationsEnabled ? { opacity: 1, x: 0 } : undefined}
                  transition={animationsEnabled ? { delay: 0.2 } : undefined}
                >
                  <h4 className='font-medium mb-2'>Common Uses:</h4>
                  <ul className='text-muted-foreground space-y-1'>
                    <li>• Website links and URLs</li>
                    <li>• Contact information (vCards)</li>
                    <li>• WiFi network credentials</li>
                    <li>• Payment information</li>
                    <li>• Product information</li>
                  </ul>
                </MotionDiv>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </ToolLayout>
  );
}
