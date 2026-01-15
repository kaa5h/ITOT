import React, { useState } from 'react';
import { Plus, Eye, Edit, Power, ChevronLeft, X, Trash2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Template, TemplateField, TemplateFieldGroup } from '../../types';

const Templates: React.FC = () => {
  const { templates, addTemplate, updateTemplate } = useAppContext();
  const [viewTemplate, setViewTemplate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deactivatingTemplate, setDeactivatingTemplate] = useState<Template | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formProtocol, setFormProtocol] = useState('');
  const [formType, setFormType] = useState<'flat' | 'grouped'>('flat');
  const [formFields, setFormFields] = useState<TemplateField[]>([]);
  const [formFieldGroups, setFormFieldGroups] = useState<TemplateFieldGroup[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormName('');
    setFormProtocol('');
    setFormType('flat');
    setFormFields([]);
    setFormFieldGroups([]);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = 'Template name is required';
    }

    if (!formProtocol.trim()) {
      errors.protocol = 'Protocol is required';
    }

    if (formType === 'flat' && formFields.length === 0) {
      errors.fields = 'At least one field is required';
    }

    if (formType === 'grouped' && formFieldGroups.length === 0) {
      errors.fieldGroups = 'At least one field group is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) {
      return;
    }

    const newTemplate: Template = {
      id: 'template-' + Date.now(),
      name: formName,
      protocol: formProtocol,
      status: 'active',
      ...(formType === 'flat' ? { fields: formFields } : { fieldGroups: formFieldGroups }),
    };

    addTemplate(newTemplate);
    setShowCreateModal(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editingTemplate || !validateForm()) {
      return;
    }

    updateTemplate(editingTemplate.id, {
      name: formName,
      protocol: formProtocol,
      ...(formType === 'flat' ? { fields: formFields, fieldGroups: undefined } : { fieldGroups: formFieldGroups, fields: undefined }),
    });

    setShowEditModal(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleDeactivate = () => {
    if (!deactivatingTemplate) {
      return;
    }

    updateTemplate(deactivatingTemplate.id, { status: 'inactive' });
    setShowDeactivateModal(false);
    setDeactivatingTemplate(null);
  };

  const handleActivate = (template: Template) => {
    updateTemplate(template.id, { status: 'active' });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormProtocol(template.protocol);
    setFormType(template.fieldGroups ? 'grouped' : 'flat');
    setFormFields(template.fields || []);
    setFormFieldGroups(template.fieldGroups || []);
    setShowEditModal(true);
  };

  const openDeactivateModal = (template: Template) => {
    setDeactivatingTemplate(template);
    setShowDeactivateModal(true);
  };

  const addField = () => {
    setFormFields([
      ...formFields,
      {
        name: 'field_' + Date.now(),
        type: 'text',
        required: false,
        label: '',
        placeholder: '',
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const addFieldGroup = () => {
    setFormFieldGroups([
      ...formFieldGroups,
      {
        name: 'Group ' + (formFieldGroups.length + 1),
        fields: [],
      },
    ]);
  };

  const updateFieldGroup = (index: number, name: string) => {
    const updated = [...formFieldGroups];
    updated[index].name = name;
    setFormFieldGroups(updated);
  };

  const removeFieldGroup = (index: number) => {
    setFormFieldGroups(formFieldGroups.filter((_, i) => i !== index));
  };

  const addFieldToGroup = (groupIndex: number) => {
    const updated = [...formFieldGroups];
    updated[groupIndex].fields.push({
      name: 'field_' + Date.now(),
      type: 'text',
      required: false,
      label: '',
      placeholder: '',
    });
    setFormFieldGroups(updated);
  };

  const updateGroupField = (groupIndex: number, fieldIndex: number, updates: Partial<TemplateField>) => {
    const updated = [...formFieldGroups];
    updated[groupIndex].fields[fieldIndex] = { ...updated[groupIndex].fields[fieldIndex], ...updates };
    setFormFieldGroups(updated);
  };

  const removeGroupField = (groupIndex: number, fieldIndex: number) => {
    const updated = [...formFieldGroups];
    updated[groupIndex].fields = updated[groupIndex].fields.filter((_, i) => i !== fieldIndex);
    setFormFieldGroups(updated);
  };

  const selectedTemplate = templates.find((t) => t.id === viewTemplate);

  // View Template Detail
  if (viewTemplate && selectedTemplate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setViewTemplate(null)}
            className="inline-flex items-center text-blue-600 hover:underline mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedTemplate.name} Template</h1>
          <p className="text-gray-600">Template details and structure</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Protocol:</span>{' '}
                <span className="text-gray-900">{selectedTemplate.protocol}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>{' '}
                <span className={selectedTemplate.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                  {selectedTemplate.status}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>{' '}
                <span className="text-gray-900">
                  {selectedTemplate.fieldGroups ? 'Grouped (Complex)' : 'Flat (Simple)'}
                </span>
              </div>
            </div>
          </div>

          {selectedTemplate.fieldGroups ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Groups</h2>
              {selectedTemplate.fieldGroups.map((group) => (
                <div key={group.name} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
                  <h3 className="font-medium text-gray-900 mb-3">{group.name}</h3>
                  <div className="space-y-2">
                    {group.fields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{field.label}</span>
                          {field.required && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fields</h2>
              <div className="space-y-2">
                {selectedTemplate.fields?.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                      {field.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{field.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Template Form Component (used for both create and edit)
  const TemplateForm = () => (
    <div className="space-y-4">
      {/* Template Name */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g., Modbus TCP"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            formErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {formErrors.name && <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>}
      </div>

      {/* Protocol */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Protocol <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formProtocol}
          onChange={(e) => setFormProtocol(e.target.value)}
          placeholder="e.g., modbus-tcp"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            formErrors.protocol ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {formErrors.protocol && <p className="text-sm text-red-600 mt-1">{formErrors.protocol}</p>}
      </div>

      {/* Template Type */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Template Type <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={formType === 'flat'}
              onChange={() => setFormType('flat')}
              className="mr-2"
            />
            <span className="text-sm text-gray-900">Flat (Simple)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={formType === 'grouped'}
              onChange={() => setFormType('grouped')}
              className="mr-2"
            />
            <span className="text-sm text-gray-900">Grouped (Complex)</span>
          </label>
        </div>
      </div>

      {/* Fields (Flat) */}
      {formType === 'flat' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900">
              Fields <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addField}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Field
            </button>
          </div>
          {formErrors.fields && <p className="text-sm text-red-600 mb-2">{formErrors.fields}</p>}
          <div className="space-y-3">
            {formFields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900">Field {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Field Label"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </div>
                <div className="mt-2">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="mr-2"
                    />
                    Required field
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Groups (Grouped) */}
      {formType === 'grouped' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900">
              Field Groups <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addFieldGroup}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Group
            </button>
          </div>
          {formErrors.fieldGroups && <p className="text-sm text-red-600 mb-2">{formErrors.fieldGroups}</p>}
          <div className="space-y-4">
            {formFieldGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={group.name}
                    onChange={(e) => updateFieldGroup(groupIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => removeFieldGroup(groupIndex)}
                    className="ml-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addFieldToGroup(groupIndex)}
                  className="text-sm text-blue-600 hover:underline mb-2"
                >
                  + Add Field to Group
                </button>
                <div className="space-y-2">
                  {group.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Field {fieldIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeGroupField(groupIndex, fieldIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Field Label"
                          value={field.label}
                          onChange={(e) => updateGroupField(groupIndex, fieldIndex, { label: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateGroupField(groupIndex, fieldIndex, { type: e.target.value as any })}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="textarea">Textarea</option>
                        </select>
                      </div>
                      <label className="flex items-center text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateGroupField(groupIndex, fieldIndex, { required: e.target.checked })}
                          className="mr-1"
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Main Template List View
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
            <p className="text-gray-600">Manage protocol templates</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {template.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Protocol:</span> {template.protocol}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {template.fieldGroups ? 'Complex (Grouped Fields)' : 'Simple (Flat Fields)'}
                  </div>
                  <div>
                    <span className="font-medium">Fields:</span>{' '}
                    {template.fieldGroups
                      ? template.fieldGroups.reduce((sum, g) => sum + g.fields.length, 0)
                      : template.fields?.length || 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewTemplate(template.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {template.status === 'inactive' ? (
                  <button
                    onClick={() => handleActivate(template)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Activate"
                  >
                    <Power className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => openDeactivateModal(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Deactivate"
                  >
                    <Power className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center space-x-3">
                <Plus className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Create New Template</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <TemplateForm />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center space-x-3">
                <Edit className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Edit Template</h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <TemplateForm />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && deactivatingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-semibold text-gray-900">Deactivate Template</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatingTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> Deactivating this template will prevent it from being used for new requests.
                  Existing requests using this template will not be affected.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  <strong>Template:</strong> {deactivatingTemplate.name}
                </p>
                <p className="text-sm text-gray-900">
                  <strong>Protocol:</strong> {deactivatingTemplate.protocol}
                </p>
              </div>

              <p className="text-sm text-gray-700">
                Are you sure you want to deactivate this template? You can reactivate it later if needed.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivatingTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Deactivate Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
