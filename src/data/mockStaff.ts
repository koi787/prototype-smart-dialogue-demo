export type MockReceptionist = {
  id: string
  name: string
}

export const mockReceptionists: MockReceptionist[] = [
  { id: 'teacher-zhang', name: '张老师' },
  { id: 'teacher-zhang-lu', name: '张露' },
  { id: 'teacher-zhang-wei', name: '张伟' },
  { id: 'teacher-wang', name: '王老师' },
  { id: 'teacher-li', name: '李老师' },
]

export const mockEmployeeReceptionistPermissionIds = mockReceptionists.map((teacher) => teacher.id)

export const mockCurrentEmployee = mockReceptionists[0]
