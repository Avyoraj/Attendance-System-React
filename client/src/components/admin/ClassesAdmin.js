import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, BookOpen, GraduationCap } from 'lucide-react';

const ClassesAdmin = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/classes');
      console.log('Classes response:', response.data);
      // Handle both formats: direct array or {classes: [...]} object
      const classesData = Array.isArray(response.data) ? response.data : response.data.classes || [];
      
      // Ensure each class has the necessary properties
      const processedClasses = classesData.map(cls => ({
        ...cls,
        id: cls._id || cls.id, // Ensure id is available
        _id: cls._id || cls.id, // Ensure _id is available
        enrolled_students: cls.enrolled_students || cls.students?.length || 0 // Handle different formats
      }));
      
      setClasses(processedClasses);
      setLoading(false);
    } catch (error) {
      // Ignore axios cancellation errors triggered by interceptors
      if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
        setLoading(false);
        return;
      }
      console.error('Error fetching classes:', error);
      setLoading(false);
      setClasses([]);
    }
  };

  const fetchEnrolledStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      const response = await axios.get(`/api/classes/${classId}/students`);
      setEnrolledStudents(response.data);
      setLoadingStudents(false);
    } catch (error) {
      if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') {
        setLoadingStudents(false);
        return;
      }
      console.error('Error fetching enrolled students:', error);
      setLoadingStudents(false);
    }
  };

  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    fetchEnrolledStudents(classItem._id || classItem.id);
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
        </div>
        <div className="relative w-full sm:w-auto">
          <input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search classes..." 
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <div className="lg:col-span-1 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">All Classes</h3>
            <p className="text-sm text-gray-500 mt-1">{classes.length} total</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredClasses.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredClasses.map((cls) => (
                  <li 
                    key={cls.id || cls._id} 
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${(selectedClass?.id === cls.id || selectedClass?._id === cls._id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleClassSelect(cls)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {cls.enrolled_students || 0} students enrolled
                        </p>
                      </div>
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No classes found
              </div>
            )}
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="lg:col-span-2 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-700">
              {selectedClass ? `${selectedClass.name} - Enrolled Students` : 'Select a class to view enrolled students'}
            </h3>
            {selectedClass && (
              <p className="text-sm text-gray-500 mt-1">{enrolledStudents.length} students</p>
            )}
          </div>
          <div className="p-4">
            {!selectedClass ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-12 w-12 mb-2" />
                <p>Select a class to view enrolled students</p>
              </div>
            ) : loadingStudents ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : enrolledStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrolledStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId || student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.section}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-12 w-12 mb-2" />
                <p>No students enrolled in this class</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesAdmin;