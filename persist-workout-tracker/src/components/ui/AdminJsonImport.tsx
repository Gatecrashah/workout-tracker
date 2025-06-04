'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Calendar, Users, Activity } from 'lucide-react';
import { importWorkoutData, ImportResult, testDatabaseConnection } from '@/lib/importWorkoutData';

const AdminJsonImport = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [importStatus, setImportStatus] = useState('idle'); // idle, validating, importing, success, error
  const [validationResults, setValidationResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Process selected file
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile.name.endsWith('.json')) {
      setErrorMessage('Please select a JSON file');
      return;
    }

    setFile(selectedFile);
    setImportStatus('validating');
    setErrorMessage('');

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);
      
      // Validate JSON structure
      const validation = validateJsonStructure(data);
      setValidationResults(validation);
      setJsonData(data);
      
      if (validation.isValid) {
        setImportStatus('idle');
      } else {
        setImportStatus('error');
        setErrorMessage('JSON structure validation failed');
      }
    } catch (error) {
      setImportStatus('error');
      setErrorMessage(`Failed to parse JSON: ${error.message}`);
    }
  };

  // Validate JSON structure against expected format
  const validateJsonStructure = (data) => {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {}
    };

    try {
      // Check if it's an array with at least one object
      if (!Array.isArray(data) || data.length === 0) {
        results.errors.push('JSON must be an array with at least one object');
        results.isValid = false;
        return results;
      }

      const weekData = data[0];

      // Check required top-level fields
      const requiredFields = ['source_file', 'programs'];
      for (const field of requiredFields) {
        if (!weekData[field]) {
          results.errors.push(`Missing required field: ${field}`);
          results.isValid = false;
        }
      }

      // Validate programs structure
      if (weekData.programs && typeof weekData.programs === 'object') {
        const programNames = Object.keys(weekData.programs);
        results.summary.totalPrograms = programNames.length;
        results.summary.programNames = programNames;

        let totalDays = 0;
        let totalExercises = 0;

        // Check each program
        for (const [programName, program] of Object.entries(weekData.programs)) {
          if (!program.days || typeof program.days !== 'object') {
            results.errors.push(`Program "${programName}" missing days object`);
            results.isValid = false;
            continue;
          }

          const days = Object.keys(program.days);
          totalDays += days.length;

          // Check each day
          for (const [dayName, day] of Object.entries(program.days)) {
            if (!day.sections || !Array.isArray(day.sections)) {
              results.warnings.push(`Day "${dayName}" in "${programName}" missing sections array`);
              continue;
            }

            // Count exercises
            for (const section of day.sections) {
              if (section.exercises && Array.isArray(section.exercises)) {
                totalExercises += section.exercises.length;
              }
            }
          }
        }

        results.summary.totalDays = totalDays;
        results.summary.totalExercises = totalExercises;
      }

      // Check week info
      if (weekData.week_info) {
        results.summary.weekInfo = {
          title: weekData.week_info.week_title,
          startDate: weekData.week_info.start_date,
          endDate: weekData.week_info.end_date
        };
      }

      results.summary.sourceFile = weekData.source_file;

    } catch (error) {
      results.errors.push(`Validation error: ${error.message}`);
      results.isValid = false;
    }

    return results;
  };

  // Test database connection
  const handleTestConnection = async () => {
    setImportStatus('validating');
    setErrorMessage('');
    
    try {
      const result = await testDatabaseConnection();
      
      if (result.success) {
        setImportStatus('idle');
        alert(result.message);
      } else {
        setImportStatus('error');
        setErrorMessage(result.error || result.message);
      }
    } catch (error) {
      setImportStatus('error');
      setErrorMessage(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle import to database
  const handleImport = async () => {
    if (!jsonData || !validationResults.isValid) return;

    setImportStatus('importing');
    
    try {
      const result: ImportResult = await importWorkoutData(jsonData);
      
      if (result.success) {
        setImportStatus('success');
        // Update validation results to show import stats
        if (result.stats) {
          setValidationResults(prev => prev ? {
            ...prev,
            summary: {
              ...prev.summary,
              importStats: result.stats
            }
          } : null);
        }
      } else {
        setImportStatus('error');
        setErrorMessage(result.error || result.message);
      }
    } catch (error) {
      setImportStatus('error');
      setErrorMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset state
  const handleReset = () => {
    setFile(null);
    setJsonData(null);
    setImportStatus('idle');
    setValidationResults(null);
    setErrorMessage('');
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">JSON Import</h1>
        <p className="text-gray-600">Import weekly workout data from Python extraction</p>
      </div>

      {/* File Upload Area */}
      {!file && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop your JSON file here
          </h3>
          <p className="text-gray-500 mb-4">
            or click to browse
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <FileText className="w-4 h-4 mr-2" />
            Select JSON File
          </label>
        </div>
      )}

      {/* File Preview and Validation */}
      {file && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <h3 className="font-medium text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Validation Status */}
          {importStatus === 'validating' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">Validating JSON structure...</span>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validationResults && (
            <div className="space-y-4">
              {/* Summary */}
              {validationResults.isValid && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-green-800 mb-2">
                        JSON Validation Passed
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-700">
                            {validationResults.summary.totalPrograms} Programs
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-700">
                            {validationResults.summary.totalDays} Days
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Activity className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-700">
                            {validationResults.summary.totalExercises} Exercises
                          </span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-green-600 mr-1" />
                          <span className="text-green-700">
                            {validationResults.summary.sourceFile}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Week Info */}
              {validationResults.summary.weekInfo && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Week Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <br />
                      <span className="text-gray-900">{validationResults.summary.weekInfo.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <br />
                      <span className="text-gray-900">{validationResults.summary.weekInfo.startDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <br />
                      <span className="text-gray-900">{validationResults.summary.weekInfo.endDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Programs List */}
              {validationResults.summary.programNames && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Programs Found</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {validationResults.summary.programNames.map((name, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {validationResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {validationResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validationResults.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                      <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                        {validationResults.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection and Import Buttons */}
          {validationResults?.isValid && importStatus !== 'importing' && importStatus !== 'success' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleTestConnection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Database
              </button>
              <button
                onClick={handleImport}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Import to Database
              </button>
            </div>
          )}

          {/* Import Status */}
          {importStatus === 'importing' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">Importing data to database...</span>
              </div>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Import completed successfully!</span>
                  </div>
                  {validationResults?.summary?.importStats && (
                    <div className="text-sm text-green-700 ml-7">
                      Imported: {validationResults.summary.importStats.programs} programs, {' '}
                      {validationResults.summary.importStats.days} days, {' '}
                      {validationResults.summary.importStats.sections} sections, {' '}
                      {validationResults.summary.importStats.exercises} exercises
                    </div>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminJsonImport;