export class RouteConstants {
  private constructor() {
  }

  public static readonly Auth = class {
    public static readonly START_AUTHENTICATION = '/start_authentication';
    public static readonly PERSIST_REGISTRATION = '/persist_registration';
  }

  public static readonly Courses = class {
    public static readonly GET_MY_TEACHER_COURSES = '/getMyTeacherCourses';
  }
}